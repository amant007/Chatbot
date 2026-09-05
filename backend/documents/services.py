import os
import re
import math
import logging
from typing import List, Dict, Any, Tuple
from django.core.cache import cache
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from documents.models import Document, DocumentChunk

logger = logging.getLogger(__name__)

class DocumentIngestionService:
    """
    Ingests, cleans, chunks and indexes raw text or uploaded documents.
    """
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 400, overlap: int = 60) -> List[str]:
        """
        Splits text into sliding-window chunks respecting sentence boundaries where possible.
        """
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        if not cleaned_text:
            return []

        sentences = re.split(r'(?<=[.!?\n])\s+', cleaned_text)
        chunks = []
        current_chunk = []
        current_len = 0

        for sentence in sentences:
            sentence_len = len(sentence)
            if current_len + sentence_len > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                # Keep last few sentences for overlap
                overlap_chunk = []
                overlap_len = 0
                for s in reversed(current_chunk):
                    if overlap_len + len(s) <= overlap:
                        overlap_chunk.insert(0, s)
                        overlap_len += len(s)
                    else:
                        break
                current_chunk = overlap_chunk
                current_len = overlap_len

            current_chunk.append(sentence)
            current_len += sentence_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        cache.delete("doc_qa_vectorizer_cache")
        return chunks

    @classmethod
    def process_and_save_document(cls, document: Document) -> int:
        """
        Processes a document, generates chunks, and updates database records.
        """
        document.chunks.all().delete()

        chunks = cls.chunk_text(document.raw_content)
        chunk_objects = []

        for idx, chunk_text in enumerate(chunks):
            token_est = math.ceil(len(chunk_text) / 4)
            chunk_objects.append(DocumentChunk(
                document=document,
                chunk_index=idx + 1,
                content=chunk_text,
                token_count=token_est
            ))

        DocumentChunk.objects.bulk_create(chunk_objects)
        document.total_chunks = len(chunk_objects)
        document.save(update_fields=['total_chunks'])
        
        cache.delete("doc_qa_vectorizer_cache")
        return len(chunk_objects)


class DocumentQARetriever:
    """
    RAG & Document Question-Answering Retrieval Engine using TF-IDF + N-gram Cosine Ranking.
    """
    @classmethod
    def get_index_data(cls):
        """
        Loads all active document chunks and cached TF-IDF matrix.
        """
        cache_data = cache.get("doc_qa_vectorizer_cache")
        if cache_data is not None:
            return cache_data

        chunks = list(DocumentChunk.objects.select_related('document').filter(document__is_active=True))
        if not chunks:
            return None

        corpus = [f"{c.document.title} {c.content}" for c in chunks]
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            max_df=1.0,
            min_df=1,
            stop_words='english',
            sublinear_tf=True
        )
        try:
            tfidf_matrix = vectorizer.fit_transform(corpus)
            data = {
                'vectorizer': vectorizer,
                'tfidf_matrix': tfidf_matrix,
                'chunks': chunks
            }
            cache.set("doc_qa_vectorizer_cache", data, timeout=600)
            return data
        except Exception as e:
            logger.error(f"Failed to fit TF-IDF vectorizer: {e}")
            return None

    @classmethod
    def retrieve_relevant_chunks(cls, query: str, top_k: int = 3, similarity_threshold: float = 0.10) -> List[Dict[str, Any]]:
        """
        Retrieves the most relevant document chunks for the given user query.
        """
        index_data = cls.get_index_data()
        if not index_data:
            return []

        vectorizer = index_data['vectorizer']
        tfidf_matrix = index_data['tfidf_matrix']
        chunks = index_data['chunks']

        try:
            query_vec = vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()

            top_indices = similarities.argsort()[::-1]
            results = []

            for idx in top_indices:
                score = float(similarities[idx])
                if score < similarity_threshold and len(results) > 0:
                    break
                if score > 0.02:
                    chunk: DocumentChunk = chunks[idx]
                    results.append({
                        'chunk_id': chunk.id,
                        'document_id': chunk.document.id,
                        'document_title': chunk.document.title,
                        'document_category': chunk.document.category,
                        'chunk_index': chunk.chunk_index,
                        'content': chunk.content,
                        'similarity_score': round(score, 4),
                        'token_count': chunk.token_count
                    })
                if len(results) >= top_k:
                    break

            return results
        except Exception as err:
            logger.error(f"Error during chunk retrieval: {err}")
            return []


class DynamicAIBotEngine:
    """
    Intelligent Conversational AI Engine supporting:
    1. Google Gemini API (Dynamic LLM)
    2. OpenAI API (Dynamic LLM)
    3. Smart Grounded RAG Synthesis (Zero-config instant fallback)
    """

    @classmethod
    def _call_gemini(cls, query: str, context_text: str, api_key: str, model_name: str) -> str:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name=model_name or "gemini-1.5-flash",
                system_instruction=(
                    "You are OmniChat AI, an intelligent, helpful, and highly articulate assistant. "
                    "When provided with Knowledge Base context, answer accurately citing relevant information. "
                    "Use clear formatting with markdown, bullet points, and code blocks where helpful."
                )
            )

            prompt = (
                f"User Question: {query}\n\n"
                f"Retrieved Document Context:\n{context_text if context_text else 'No specific document context found.'}\n\n"
                "Please provide a comprehensive and helpful response."
            )
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            return "No response received from Gemini API."
        except Exception as e:
            logger.error(f"Gemini API generation error: {e}")
            raise e

    @classmethod
    def _call_openai(cls, query: str, context_text: str, api_key: str, model_name: str) -> str:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are OmniChat AI, an intelligent conversational assistant. "
                        "When provided with Knowledge Base context, answer accurately using the facts. "
                        "Format your output cleanly with markdown."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"User Query: {query}\n\n"
                        f"Knowledge Base Context:\n{context_text if context_text else 'No document context provided.'}\n\n"
                        "Answer:"
                    )
                }
            ]
            res = client.chat.completions.create(
                model=model_name or "gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            raise e

    @classmethod
    def _synthesize_smart_rag(cls, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Smart offline dynamic synthesis when no external API key is configured.
        """
        clean_q = query.strip().lower()

        # Greetings & identity
        if re.search(r'\b(hello|hi|hey|greetings|hola)\b', clean_q):
            return (
                "👋 **Hello! Welcome to OmniChat AI.**\n\n"
                "I am an AI-powered conversational assistant equipped with **Document-Based Question Answering (RAG)**, "
                "conversation thread management, and full **System Observability & Distributed Tracing**.\n\n"
                "💡 *Tip:* You can ask me technical questions, search your uploaded documents, or add your `GEMINI_API_KEY` / `OPENAI_API_KEY` in `.env` for open-ended dynamic generation!"
            )

        # Context-based RAG synthesis
        if context_chunks:
            parts = [
                f"### 📚 Answer from Knowledge Base ({len(context_chunks)} relevant source{'s' if len(context_chunks) > 1 else ''}):\n"
            ]
            for idx, chunk in enumerate(context_chunks, 1):
                parts.append(
                    f"**[{idx}] {chunk['document_title']}** *(Relevance Score: {int(chunk['similarity_score'] * 100)}%)*:\n"
                    f"> \"{chunk['content']}\"\n"
                )
            parts.append(
                "✨ **Insight Summary:** The above knowledge excerpts directly address your inquiry. "
                "You can inspect the full source documents in the **Documents** tab or ask follow-up questions!"
            )
            return "\n".join(parts)

        # Default intelligent response
        return (
            f"I received your question: **\"{query}\"**.\n\n"
            "🔍 *Knowledge Base Check:* No specific matching document chunks were found above the relevance threshold in the current knowledge base.\n\n"
            "**Next steps:**\n"
            "1. Upload relevant files/text in the **Documents** tab to query your own data.\n"
            "2. Add your `GEMINI_API_KEY` or `OPENAI_API_KEY` in `backend/.env` to unlock open-ended dynamic AI answers for any general topic!"
        )

    @classmethod
    def generate_response(cls, query: str, context_chunks: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Generates dynamic response with automatic AI provider dispatch and grounded citations.
        """
        gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
        openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
        provider = os.environ.get("AI_PROVIDER", "auto").strip().lower()

        # Build context string
        context_text = ""
        if context_chunks:
            context_text = "\n\n".join([
                f"[Document {idx+1}: {c['document_title']}]\n{c['content']}"
                for idx, c in enumerate(context_chunks)
            ])

        response_text = ""

        # 1. Try Gemini
        if (provider in ("gemini", "auto")) and gemini_key:
            try:
                model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
                response_text = cls._call_gemini(query, context_text, gemini_key, model_name)
            except Exception as e:
                logger.warning(f"Gemini failed, falling back: {e}")

        # 2. Try OpenAI
        if not response_text and ((provider in ("openai", "auto")) and openai_key):
            try:
                model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
                response_text = cls._call_openai(query, context_text, openai_key, model_name)
            except Exception as e:
                logger.warning(f"OpenAI failed, falling back: {e}")

        # 3. Smart Grounded RAG Synthesis fallback
        if not response_text:
            response_text = cls._synthesize_smart_rag(query, context_chunks)

        # Build Citations
        citations = []
        for idx, chunk in enumerate(context_chunks, 1):
            citations.append({
                'citation_number': idx,
                'document_id': chunk['document_id'],
                'document_title': chunk['document_title'],
                'chunk_index': chunk['chunk_index'],
                'similarity_score': chunk['similarity_score'],
                'excerpt': chunk['content'][:180] + "..." if len(chunk['content']) > 180 else chunk['content']
            })

        return response_text, citations


# Backward-compatible alias
StaticBotEngine = DynamicAIBotEngine
