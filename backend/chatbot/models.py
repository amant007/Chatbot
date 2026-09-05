from django.db import models


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(
        max_length=5,
        choices=[
            ('USER', 'USER'),
            ('ADMIN', 'ADMIN'),
        ],
        default='USER'
    )
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'users'


class Conversation(models.Model):
    conversation_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id'
    )
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=8,
        choices=[
            ('ACTIVE', 'ACTIVE'),
            ('ARCHIVED', 'ARCHIVED'),
        ],
        default='ACTIVE'
    )
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'conversations'


class Message(models.Model):
    message_id = models.AutoField(primary_key=True)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        db_column='conversation_id'
    )
    sender_type = models.CharField(
        max_length=4,
        choices=[
            ('USER', 'USER'),
            ('AI', 'AI'),
        ]
    )
    message_text = models.TextField()
    message_type = models.CharField(
        max_length=8,
        choices=[
            ('TEXT', 'TEXT'),
            ('DOCUMENT', 'DOCUMENT'),
        ],
        default='TEXT'
    )
    token_count = models.IntegerField(null=True, blank=True)
    response_time = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True
    )
    model_name = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'messages'


class Document(models.Model):
    document_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id'
    )
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.SET_NULL,
        db_column='conversation_id',
        null=True,
        blank=True
    )
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100, null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    file_path = models.CharField(max_length=500, null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=[
            ('UPLOADED', 'UPLOADED'),
            ('PROCESSING', 'PROCESSING'),
            ('COMPLETED', 'COMPLETED'),
            ('FAILED', 'FAILED'),
        ],
        default='UPLOADED'
    )
    extracted_text = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'documents'


class Feedback(models.Model):
    feedback_id = models.AutoField(primary_key=True)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        db_column='message_id'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id'
    )
    rating = models.IntegerField(null=True, blank=True)
    feedback_type = models.CharField(
        max_length=8,
        choices=[
            ('POSITIVE', 'POSITIVE'),
            ('NEGATIVE', 'NEGATIVE'),
        ],
        null=True,
        blank=True
    )
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'feedback'