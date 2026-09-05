from documents.models import Document
from documents.services import DocumentIngestionService

SEED_DOCUMENTS = [
    {
        "title": "System Design & Layered Architecture",
        "category": "System Design",
        "raw_content": """
System Design in modern web platforms revolves around modularity, separation of concerns, and scalable data layers.
The client layer (React) handles user interactions, rendering markdown, and client-side caching.
The API Gateway layer (Django REST Framework) routes requests, applies rate-limiting, and decorates transactions with distributed trace identifiers.
The Service layer encapsulates business logic such as vector retrieval, chunk ranking, and session orchestration.
The Caching layer (Redis) prevents duplicate compute on identical queries and acts as an in-memory token blacklist.
The Persistence layer (MySQL) ensures ACID-compliant storage for users, chat sessions, message trees, and telemetry event logs.
Designing for high availability requires horizontal scaling of stateless web servers and read-replica scaling for the MySQL database.
        """
    },
    {
        "title": "Observability, Distributed Tracing & Latency Metrics",
        "category": "Observability",
        "raw_content": """
Observability is the ability to infer the internal health and performance states of a system based on its external outputs (metrics, logs, and traces).
Distributed Tracing utilizes unique Trace IDs (such as X-Trace-ID) passed through all layers of the request lifecycle.
Latency profiling measures execution duration across critical paths, notably p50 (median) and p95 (95th percentile worst-case) response times.
Observability middleware in Django records execution duration in milliseconds, SQL query count from the database connection, HTTP status codes, and user IP addresses.
This telemetry data is aggregated in real-time to generate analytics dashboards, alerting operators to slow endpoints, cache misses, or elevated error rates.
        """
    },
    {
        "title": "Document-Based Question Answering & RAG Pipelines",
        "category": "Document QA",
        "raw_content": """
Document-based Question Answering (Doc QA) or Retrieval-Augmented Generation (RAG) grounds responses in verified external knowledge documents.
The pipeline consists of three fundamental stages:
1. Ingestion & Chunking: Ingesting text and segmenting documents into sliding-window chunks (e.g. 400 characters with 60 character overlap) to preserve context.
2. Indexing & Vectorization: Transforming chunks into TF-IDF or dense vector matrices for similarity calculation.
3. Retrieval & Grounding: Finding the top-k most relevant chunks using cosine similarity ranking against user query vectors, then formatting responses with source citations.
Citations provide transparency, provenance, and allow users to audit the exact document chunk from which an answer was derived.
        """
    },
    {
        "title": "Redis Caching Strategies & Blacklist Invalidation",
        "category": "Caching & Performance",
        "raw_content": """
Redis is an in-memory data store used for sub-millisecond caching and token invalidation.
Query Caching: Chat responses to identical or frequently asked queries can be hashed into cache keys (e.g. 'chat_query_<hash>') with a Time-To-Live (TTL).
Cache Hits bypass database queries and vector computation, reducing response times from 150ms down to under 5ms.
Token Blacklisting: Revoked JWT token JTIs and malicious IP addresses are stored in Redis key-value sets with fast O(1) lookups during authentication middleware execution.
When Redis is unavailable, the system gracefully falls back to local in-memory caching without disrupting application uptime.
        """
    }
]

def seed_initial_knowledge():
    """
    Populates default knowledge base articles if none exist.
    """
    if Document.objects.exists():
        return
    for doc_data in SEED_DOCUMENTS:
        doc = Document.objects.create(
            title=doc_data["title"],
            category=doc_data["category"],
            source_type="system",
            raw_content=doc_data["raw_content"].strip()
        )
        DocumentIngestionService.process_and_save_document(doc)
