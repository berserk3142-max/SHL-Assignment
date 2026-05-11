"""FAISS-based vector retrieval engine for SHL assessments."""
import json
import os
import numpy as np

# We use a lightweight approach - TF-IDF based similarity
# This avoids the heavy sentence-transformers dependency
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CATALOG_PATH = os.path.join(DATA_DIR, "catalog.json")

TYPE_MAP = {
    "A": "Ability & Aptitude",
    "B": "Biodata & Situational Judgment",
    "C": "Competency",
    "D": "Development & 360",
    "E": "Assessment Exercises",
    "K": "Knowledge & Skills",
    "P": "Personality & Behavior",
    "S": "Simulations",
}


class AssessmentRetriever:
    """Retrieves relevant SHL assessments using TF-IDF + cosine similarity."""

    def __init__(self):
        self.catalog: list[dict] = []
        self.texts: list[str] = []
        self.vectorizer: TfidfVectorizer | None = None
        self.tfidf_matrix = None
        self.valid_urls: set[str] = set()
        self._load_and_index()

    def _load_and_index(self):
        """Load catalog and build TF-IDF index."""
        if not os.path.exists(CATALOG_PATH):
            print(f"WARNING: Catalog not found at {CATALOG_PATH}")
            return

        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            self.catalog = json.load(f)

        # Build searchable text for each assessment
        self.texts = [self._make_searchable_text(a) for a in self.catalog]
        self.valid_urls = {a["url"] for a in self.catalog if a.get("url")}

        # Build TF-IDF index
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(self.texts)
        print(f"Indexed {len(self.catalog)} assessments")

    def _make_searchable_text(self, assessment: dict) -> str:
        """Create rich text blob for semantic search."""
        parts = [
            f"Assessment: {assessment.get('name', '')}",
            f"Description: {assessment.get('description', '')}",
        ]

        test_types = assessment.get("test_type", [])
        type_labels = [TYPE_MAP.get(t, t) for t in test_types]
        if type_labels:
            parts.append(f"Test Type: {', '.join(type_labels)}")

        if assessment.get("remote_testing"):
            parts.append("Supports remote testing online proctored")
        if assessment.get("adaptive_irt"):
            parts.append("Adaptive IRT computer adaptive testing")

        return " . ".join(parts)

    def retrieve(self, query: str, top_k: int = 10) -> list[dict]:
        """Retrieve top-k relevant assessments for a query."""
        if not self.catalog or self.vectorizer is None:
            return []

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Get top-k indices
        top_indices = scores.argsort()[::-1][:top_k]

        results = []
        for idx in top_indices:
            if scores[idx] > 0.01:  # minimum relevance threshold
                item = self.catalog[idx].copy()
                item["relevance_score"] = float(scores[idx])
                results.append(item)

        return results

    def get_all(self) -> list[dict]:
        """Return the full catalog."""
        return self.catalog

    def is_valid_url(self, url: str) -> bool:
        """Check if a URL is in the catalog whitelist."""
        return url in self.valid_urls
