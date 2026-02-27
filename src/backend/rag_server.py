"""
GreenBharat AI — Pathway RAG Knowledge Server
Serves AI-powered environmental Q&A using Pathway's live DocumentStore.
Knowledge documents auto-update when files change.
"""

import os
import sys

# Check if OpenAI key is available
USE_LLM = bool(os.environ.get("OPENAI_API_KEY"))

if USE_LLM:
    try:
        import pathway as pw
        from pathway.xpacks.llm.document_store import DocumentStore
        from pathway.xpacks.llm.servers import DocumentStoreServer
        from pathway.xpacks.llm.embedders import OpenAIEmbedder
        from pathway.xpacks.llm.splitters import TokenCountSplitter
        from pathway.stdlib.indexing.nearest_neighbors import BruteForceKnnFactory
        PATHWAY_LLM_AVAILABLE = True
    except ImportError:
        PATHWAY_LLM_AVAILABLE = False
        print("[RAG] pathway xpacks.llm not available. Running in fallback mode.")
else:
    PATHWAY_LLM_AVAILABLE = False
    print("[RAG] No OPENAI_API_KEY found. Running in fallback mode.")


KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "knowledge")
RAG_PORT = 8011


def run_rag_server_pathway():
    """Run RAG using Pathway's native DocumentStore + LLM xpack."""
    print("=" * 60)
    print("  🧠 GreenBharat AI — Pathway RAG Server (LLM Mode)")
    print("=" * 60)
    print(f"  Knowledge base: {KNOWLEDGE_DIR}")
    print(f"  Port: {RAG_PORT}")
    print("=" * 60)

    # Ingest knowledge documents
    documents = pw.io.fs.read(
        KNOWLEDGE_DIR,
        format="binary",
        with_metadata=True,
        mode="streaming",
        autocommit_duration_ms=5000,
    )

    # Configure components
    embedder = OpenAIEmbedder(api_key=os.environ["OPENAI_API_KEY"])

    text_splitter = TokenCountSplitter(
        min_tokens=80,
        max_tokens=400,
        encoding_name="cl100k_base",
    )

    retriever_factory = BruteForceKnnFactory(
        embedder=embedder,
    )

    # Build DocumentStore with live indexing
    document_store = DocumentStore(
        docs=documents,
        retriever_factory=retriever_factory,
        splitter=text_splitter,
    )

    # Serve via HTTP
    server = DocumentStoreServer(
        host="0.0.0.0",
        port=RAG_PORT,
        document_store=document_store,
    )

    print(f"[RAG] Server starting on http://0.0.0.0:{RAG_PORT}")
    print("[RAG] Knowledge base is LIVE — updates when files change!")
    server.run()


def run_rag_server_fallback():
    """Fallback RAG server using Flask with keyword matching."""
    from flask import Flask, request, jsonify
    from flask_cors import CORS

    app = Flask(__name__)
    CORS(app)

    # Load knowledge base into memory
    knowledge_base = []
    for filename in os.listdir(KNOWLEDGE_DIR):
        if filename.endswith(".md"):
            filepath = os.path.join(KNOWLEDGE_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                # Split into sections
                sections = content.split("\n## ")
                for section in sections:
                    knowledge_base.append({
                        "source": filename,
                        "content": section.strip()
                    })

    def search_knowledge(query):
        """Simple keyword-based search with relevance scoring."""
        query_words = set(query.lower().split())
        scored = []
        for entry in knowledge_base:
            content_lower = entry["content"].lower()
            score = sum(1 for w in query_words if w in content_lower)
            # Boost for exact phrase matches
            if query.lower() in content_lower:
                score += 5
            if score > 0:
                scored.append((score, entry))
        scored.sort(key=lambda x: -x[0])
        return scored[:3]

    def generate_answer(query, context_entries):
        """Generate a helpful answer from context."""
        if not context_entries:
            return {
                "answer": "I don't have specific information about that in my knowledge base. Try asking about air quality standards, sustainability tips, or India's climate initiatives.",
                "sources": []
            }

        # Build context
        context_parts = []
        sources = []
        for score, entry in context_entries:
            context_parts.append(entry["content"][:500])
            if entry["source"] not in sources:
                sources.append(entry["source"])

        context = "\n\n".join(context_parts)

        # Generate a summary-style answer
        answer_lines = [f"Based on the GreenBharat knowledge base:\n"]

        # Extract key points from context
        for part in context_parts[:2]:
            lines = part.split("\n")
            relevant_lines = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith("#") and len(line) > 20:
                    relevant_lines.append(line)
                if len(relevant_lines) >= 4:
                    break
            if relevant_lines:
                answer_lines.extend(relevant_lines)

        return {
            "answer": "\n".join(answer_lines),
            "sources": sources
        }

    @app.route("/v1/retrieve", methods=["POST"])
    def retrieve():
        data = request.json
        query = data.get("query", "")
        results = search_knowledge(query)
        return jsonify({
            "results": [
                {"content": entry["content"][:500], "source": entry["source"], "score": score}
                for score, entry in results
            ]
        })

    @app.route("/v1/answer", methods=["POST"])
    def answer():
        data = request.json
        query = data.get("query", "")
        results = search_knowledge(query)
        response = generate_answer(query, results)
        return jsonify(response)

    @app.route("/", methods=["POST"])
    def root_query():
        """Handle queries at root path."""
        data = request.json
        query = data.get("query", data.get("messages", ""))
        results = search_knowledge(query)
        response = generate_answer(query, results)
        return jsonify(response)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "healthy", "mode": "fallback", "documents": len(knowledge_base)})

    print("=" * 60)
    print("  🧠 GreenBharat AI — RAG Server (Fallback Mode)")
    print("=" * 60)
    print(f"  Knowledge base: {KNOWLEDGE_DIR}")
    print(f"  Documents loaded: {len(knowledge_base)} sections")
    print(f"  Port: {RAG_PORT}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=RAG_PORT, debug=False)


if __name__ == "__main__":
    if PATHWAY_LLM_AVAILABLE and USE_LLM:
        run_rag_server_pathway()
    else:
        run_rag_server_fallback()
