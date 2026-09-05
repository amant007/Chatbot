import uuid
from django.db import models
from django.contrib.auth.models import User
from documents.models import Document

class Conversation(models.Model):
    """
    Conversation Session Model supporting both authenticated users and anonymous guest sessions.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='conversations')
    guest_session_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    title = models.CharField(max_length=255, default='New Conversation')
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-is_pinned', '-updated_at']

    def __str__(self):
        owner = self.user.username if self.user else f"Guest ({self.guest_session_id})"
        return f"[{owner}] {self.title}"


class Message(models.Model):
    """
    Message item containing role, content, token usage observability metrics, and trace linkage.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # Observability & System Design Telemetry
    prompt_tokens = models.IntegerField(default=0)
    completion_tokens = models.IntegerField(default=0)
    latency_ms = models.FloatField(default=0.0, help_text="Generation latency in milliseconds")
    trace_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    cache_hit = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role.upper()} ({self.conversation.id}): {self.content[:40]}"


class Citation(models.Model):
    """
    Document citation provenance grounding the assistant's answer in specific document chunks.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='citations')
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    document_title = models.CharField(max_length=255)
    chunk_index = models.IntegerField(default=1)
    similarity_score = models.FloatField(default=0.0)
    excerpt = models.TextField()

    def __str__(self):
        return f"Citation [{self.document_title} - Chunk #{self.chunk_index}] ({self.similarity_score:.2f})"


class UserFeedback(models.Model):
    """
    User satisfaction & feedback model on AI responses for evaluation and monitoring.
    """
    FEEDBACK_TYPES = [
        ('thumbs_up', 'Thumbs Up (Positive)'),
        ('thumbs_down', 'Thumbs Down (Negative)'),
    ]
    message = models.OneToOneField(Message, on_delete=models.CASCADE, related_name='feedback')
    rating_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES)
    stars = models.IntegerField(default=5, help_text="1 to 5 star rating")
    tags = models.JSONField(default=list, blank=True, help_text="e.g. ['Accurate', 'Hallucinated', 'Incomplete']")
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for Msg #{self.message_id}: {self.rating_type} ({self.stars} stars)"
