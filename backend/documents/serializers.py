from rest_framework import serializers
from documents.models import Document, DocumentChunk

class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = ['id', 'chunk_index', 'content', 'token_count', 'created_at']


class DocumentSerializer(serializers.ModelSerializer):
    chunks = DocumentChunkSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'source_type', 'file_name', 'raw_content', 'category', 'is_active', 'total_chunks', 'chunks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'total_chunks', 'created_at', 'updated_at']


class DocumentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'source_type', 'file_name', 'category', 'is_active', 'total_chunks', 'created_at', 'updated_at']
