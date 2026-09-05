from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from conversations.models import Conversation, Message, UserFeedback
from documents.models import Document, DocumentChunk
from documents.services import DocumentIngestionService

class ChatAndObservabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.guest_id = "test_guest_12345"

        # Ingest a sample doc
        self.doc = Document.objects.create(
            title="Distributed Systems and Tracing",
            category="System Design",
            raw_content="Distributed tracing allows tracing a request from edge gateway to persistence using trace IDs and measuring latency in milliseconds."
        )
        DocumentIngestionService.process_and_save_document(self.doc)

    def test_guest_session_init(self):
        response = self.client.post('/api/auth/guest/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('guest_id', response.data)

    def test_send_message_and_trace_telemetry(self):
        response = self.client.post(
            '/api/chat/send/',
            {'query': 'How does distributed tracing work?', 'guest_id': self.guest_id},
            format='json',
            HTTP_X_GUEST_SESSION=self.guest_id
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('observability', response.data)
        self.assertIn('trace_id', response.data['observability'])
        self.assertGreater(response.data['observability']['latency_ms'], 0)
        self.assertTrue(response.has_header('X-Trace-ID'))

    def test_user_feedback_submission(self):
        # Create message
        conv = Conversation.objects.create(guest_session_id=self.guest_id, title='Test Conv')
        msg = Message.objects.create(
            conversation=conv,
            role='assistant',
            content='Test assistant response'
        )

        response = self.client.post(
            '/api/chat/feedback/',
            {
                'message_id': msg.id,
                'rating_type': 'thumbs_up',
                'stars': 5,
                'tags': ['Accurate & Factual'],
                'comment': 'Great answer'
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(UserFeedback.objects.count(), 1)
        fb = UserFeedback.objects.first()
        self.assertEqual(fb.rating_type, 'thumbs_up')
        self.assertEqual(fb.stars, 5)

    def test_admin_metrics_endpoint(self):
        response = self.client.get('/api/admin-dashboard/metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overview', response.data)
        self.assertIn('total_requests', response.data['overview'])
