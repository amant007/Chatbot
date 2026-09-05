import time
import math
import hashlib
from django.conf import settings
from django.core.cache import cache
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from conversations.models import Conversation, Message, Citation, UserFeedback
from conversations.serializers import (
    ConversationSerializer,
    ConversationListSerializer,
    MessageSerializer,
    UserFeedbackSerializer
)
from documents.services import DocumentQARetriever, StaticBotEngine

def get_request_owner_filter(request):
    """
    Returns query filter dict based on authenticated User or Guest Session ID.
    """
    if request.user.is_authenticated:
        return {'user': request.user}
    guest_id = request.headers.get('X-Guest-Session') or request.query_params.get('guest_id') or request.data.get('guest_id')
    if guest_id:
        return {'guest_session_id': guest_id, 'user__isnull': True}
    return {'id': -1} # Empty if no owner info provided


class ConversationViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for conversations with multi-user and anonymous guest isolation.
    """
    permission_classes = [AllowAny]

    def get_queryset(self):
        owner_filter = get_request_owner_filter(self.request)
        return Conversation.objects.filter(**owner_filter).prefetch_related('messages', 'messages__citations', 'messages__feedback')

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationSerializer

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            guest_id = self.request.headers.get('X-Guest-Session') or self.request.data.get('guest_id')
            serializer.save(guest_session_id=guest_id)


class SendMessageView(APIView):
    """
    Core AI Chat Endpoint:
    Flow: User Request -> Middleware (TraceID/Obs) -> Cache Check (Redis) -> Doc QA Retrieval -> Static/RAG Synthesis -> DB Persist -> Response with Citations & Metrics.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        start_time = time.perf_counter()
        
        query = request.data.get('query', '').strip()
        conversation_id = request.data.get('conversation_id')
        guest_id = request.headers.get('X-Guest-Session') or request.data.get('guest_id')

        if not query:
            return Response({'error': 'Message query content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Resolve or Create Conversation
        conversation = None
        if conversation_id:
            try:
                owner_filter = get_request_owner_filter(request)
                conversation = Conversation.objects.get(id=conversation_id, **owner_filter)
            except Conversation.DoesNotExist:
                return Response({'error': 'Conversation not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Auto-create new conversation with query as title
            title = query[:40] + ('...' if len(query) > 40 else '')
            if request.user.is_authenticated:
                conversation = Conversation.objects.create(user=request.user, title=title)
            else:
                conversation = Conversation.objects.create(guest_session_id=guest_id, title=title)

        # 2. Token Accounting for User Prompt
        prompt_tokens = math.ceil(len(query) / 4)
        trace_id = getattr(request, 'trace_id', '')

        # 3. Save User Message
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=query,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            trace_id=trace_id
        )

        # 4. Check Redis Cache for exact query result
        query_hash = hashlib.sha256(query.lower().encode('utf-8')).hexdigest()[:16]
        cache_key = f"chat_resp_{query_hash}"
        cached_result = cache.get(cache_key)

        cache_hit = False
        response_text = ""
        citations_data = []

        if cached_result:
            cache_hit = True
            request._cache_hit = True
            response_text = cached_result.get('response_text')
            citations_data = cached_result.get('citations', [])
        else:
            request._cache_hit = False
            # 5. Document QA Retrieval & Static RAG Synthesis
            relevant_chunks = DocumentQARetriever.retrieve_relevant_chunks(
                query=query,
                top_k=settings.MAX_CONTEXT_CHUNKS,
                similarity_threshold=settings.SIMILARITY_THRESHOLD
            )
            response_text, citations_data = StaticBotEngine.generate_response(query, relevant_chunks)

            # Store in Cache (TTL 5 mins)
            cache.set(cache_key, {
                'response_text': response_text,
                'citations': citations_data
            }, timeout=settings.CACHE_TTL_SECONDS)

        # 6. Latency & Token Calculation
        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000, 2)
        completion_tokens = math.ceil(len(response_text) / 4)

        # 7. Persist Assistant Message and Citations
        assistant_message = Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=response_text,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            trace_id=trace_id,
            cache_hit=cache_hit
        )

        # Save Citations
        created_citations = []
        for cit in citations_data:
            c_obj = Citation.objects.create(
                message=assistant_message,
                document_id=cit.get('document_id'),
                document_title=cit.get('document_title', 'Knowledge Doc'),
                chunk_index=cit.get('chunk_index', 1),
                similarity_score=cit.get('similarity_score', 0.0),
                excerpt=cit.get('excerpt', '')
            )
            created_citations.append(c_obj)

        # Update conversation timestamp
        conversation.save(update_fields=['updated_at'])

        return Response({
            'conversation_id': conversation.id,
            'conversation_title': conversation.title,
            'user_message': MessageSerializer(user_message).data,
            'assistant_message': MessageSerializer(assistant_message).data,
            'observability': {
                'trace_id': trace_id,
                'latency_ms': latency_ms,
                'cache_hit': cache_hit,
                'prompt_tokens': prompt_tokens,
                'completion_tokens': completion_tokens,
                'total_tokens': prompt_tokens + completion_tokens
            }
        }, status=status.HTTP_201_CREATED)


class FeedbackView(APIView):
    """
    Submits or updates user feedback (thumbs up/down, stars, tags, comment) on an AI message.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message_id = request.data.get('message_id')
        rating_type = request.data.get('rating_type', 'thumbs_up')
        stars = int(request.data.get('stars', 5))
        tags = request.data.get('tags', [])
        comment = request.data.get('comment', '').strip()

        if not message_id:
            return Response({'error': 'Message ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            message = Message.objects.get(id=message_id, role='assistant')
        except Message.DoesNotExist:
            return Response({'error': 'Assistant message not found.'}, status=status.HTTP_404_NOT_FOUND)

        feedback, created = UserFeedback.objects.update_or_create(
            message=message,
            defaults={
                'rating_type': rating_type,
                'stars': stars,
                'tags': tags,
                'comment': comment
            }
        )

        return Response({
            'message': 'Feedback recorded successfully',
            'feedback': UserFeedbackSerializer(feedback).data
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
