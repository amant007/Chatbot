from rest_framework import serializers
from conversations.models import Conversation, Message, Citation, UserFeedback

class CitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citation
        fields = ['id', 'document_id', 'document_title', 'chunk_index', 'similarity_score', 'excerpt']


class UserFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFeedback
        fields = ['id', 'message', 'rating_type', 'stars', 'tags', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    citations = CitationSerializer(many=True, read_only=True)
    feedback = UserFeedbackSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'role', 'content', 'prompt_tokens',
            'completion_tokens', 'latency_ms', 'trace_id', 'cache_hit',
            'citations', 'feedback', 'created_at'
        ]
        read_only_fields = ['id', 'prompt_tokens', 'completion_tokens', 'latency_ms', 'trace_id', 'cache_hit', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'is_pinned', 'guest_session_id', 'user', 'message_count', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'is_pinned', 'message_count', 'last_message_preview', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message_preview(self, obj):
        last_msg = obj.messages.last()
        return last_msg.content[:60] if last_msg else None
