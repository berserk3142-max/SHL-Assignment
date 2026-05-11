"""Evaluation script: tests recall@10 against sample traces."""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.agent import get_agent_reply


def recall_at_k(predicted: list[str], relevant: list[str], k: int = 10) -> float:
    predicted_k = set(predicted[:k])
    relevant_set = set(relevant)
    if not relevant_set:
        return 1.0
    return len(predicted_k & relevant_set) / len(relevant_set)


TRACES = [
    {
        "name": "Java Developer - Mid Level",
        "conversation": [
            {"role": "user", "content": "I need to hire a Java developer"},
            {"role": "user", "content": "Mid-level, needs strong OOP and testing skills, should know Java 8+"},
        ],
        "expected_urls": [
            "https://www.shl.com/products/product-catalog/view/core-java-entry-level-new/",
            "https://www.shl.com/products/product-catalog/view/core-java-advanced-level-new/",
        ],
    },
    {
        "name": "Sales Manager",
        "conversation": [
            {"role": "user", "content": "Help me hire a sales manager, senior level, needs negotiation and leadership skills"},
        ],
        "expected_urls": [
            "https://www.shl.com/products/product-catalog/view/sales-transformation-report-2-0-sales-manager/",
            "https://www.shl.com/products/product-catalog/view/sales-transformation-report-sales-manager/",
        ],
    },
    {
        "name": "Data Analyst - Python",
        "conversation": [
            {"role": "user", "content": "Looking for a data analyst who knows Python and SQL, entry level position"},
        ],
        "expected_urls": [
            "https://www.shl.com/products/product-catalog/view/python-new/",
            "https://www.shl.com/products/product-catalog/view/sql-server-new/",
        ],
    },
    {
        "name": "Personality Assessment",
        "conversation": [
            {"role": "user", "content": "What personality assessments do you have for leadership roles?"},
        ],
        "expected_urls": [
            "https://www.shl.com/products/product-catalog/view/opq-leadership-report/",
            "https://www.shl.com/products/product-catalog/view/enterprise-leadership-report/",
        ],
    },
    {
        "name": "Vague Query - Should Clarify",
        "conversation": [
            {"role": "user", "content": "I need an assessment"},
        ],
        "expected_urls": [],  # Should clarify, not recommend
        "expect_clarify": True,
    },
]


def run_trace(trace: dict) -> dict:
    messages = []
    for turn in trace["conversation"]:
        messages.append({"role": turn["role"], "content": turn["content"]})

    result = get_agent_reply(messages)

    predicted_urls = [r["url"] for r in result.get("recommendations", [])]
    expected = trace.get("expected_urls", [])

    if trace.get("expect_clarify"):
        # Should NOT recommend
        success = len(predicted_urls) == 0
        return {
            "name": trace["name"],
            "success": success,
            "score": 1.0 if success else 0.0,
            "note": "Correctly clarified" if success else f"Incorrectly recommended {len(predicted_urls)} items",
        }

    score = recall_at_k(predicted_urls, expected) if expected else (1.0 if predicted_urls else 0.0)
    return {
        "name": trace["name"],
        "score": score,
        "predicted": predicted_urls[:5],
        "expected": expected,
    }


def main():
    print("=" * 60)
    print("SHL Assessment Recommender - Evaluation")
    print("=" * 60)

    results = []
    for trace in TRACES:
        print(f"\n--- {trace['name']} ---")
        r = run_trace(trace)
        results.append(r)
        print(f"  Score: {r['score']:.2f}")
        if "note" in r:
            print(f"  {r['note']}")
        if "predicted" in r:
            print(f"  Predicted: {r.get('predicted', [])[:3]}")

    mean = sum(r["score"] for r in results) / len(results)
    print(f"\n{'=' * 60}")
    print(f"Mean Score: {mean:.3f}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
