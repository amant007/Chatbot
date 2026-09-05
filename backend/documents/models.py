from django.db import models

class Document(models.Model):
    """
    Knowledge Base Document for Document-based Question Answering (Doc QA / RAG).
    """
    SOURCE_TYPES = [
        ('manual', 'Manual Text / Markdown'),
        ('file', 'Uploaded File (TXT / MD / PDF)'),
        ('system', 'System Default Knowledge'),
    ]
    title = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, default='manual')
    file_name = models.CharField(max_length=255, blank=True, null=True)
    raw_content = models.TextField()
    category = models.CharField(max_length=100, default='General Knowledge')
    is_active = models.BooleanField(default=True)
    total_chunks = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.source_type}) - {self.total_chunks} chunks"


class DocumentChunk(models.Model):
    """
    Individual chunk of an ingested document with chunk position, content, and token estimation.
    """
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    content = models.TextField()
    token_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['document', 'chunk_index']
        indexes = [
            models.Index(fields=['document', 'chunk_index']),
        ]

    def __str__(self):
        return f"Doc #{self.document_id} [Chunk {self.chunk_index}] ({self.token_count} tokens)"
