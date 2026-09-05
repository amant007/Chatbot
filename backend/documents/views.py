from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from documents.models import Document
from documents.serializers import DocumentSerializer, DocumentListSerializer
from documents.services import DocumentIngestionService, DocumentQARetriever

class DocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Knowledge Base Documents and real-time chunking ingestion.
    """
    queryset = Document.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        # Handle file upload or raw text
        file_obj = self.request.FILES.get('file')
        raw_content = self.request.data.get('raw_content', '')
        title = self.request.data.get('title', '')
        file_name = None

        if file_obj:
            file_name = file_obj.name
            if not title:
                title = file_name
            try:
                raw_content = file_obj.read().decode('utf-8', errors='ignore')
            except Exception:
                raw_content = ""

        doc = serializer.save(
            title=title or 'Untitled Document',
            raw_content=raw_content,
            file_name=file_name,
            source_type='file' if file_obj else 'manual'
        )
        # Automatic chunking & indexing
        DocumentIngestionService.process_and_save_document(doc)

    def perform_update(self, serializer):
        doc = serializer.save()
        DocumentIngestionService.process_and_save_document(doc)


class TestRetrievalView(APIView):
    """
    Allows developers & admins to test query retrieval against the document index.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        query = request.data.get('query', '').strip()
        top_k = int(request.data.get('top_k', 3))
        if not query:
            return Response({'error': 'Query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        chunks = DocumentQARetriever.retrieve_relevant_chunks(query, top_k=top_k)
        return Response({
            'query': query,
            'match_count': len(chunks),
            'chunks': chunks
        })
