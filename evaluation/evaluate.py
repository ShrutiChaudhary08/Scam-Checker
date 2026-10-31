"""
Scam Checker Evaluation Pipeline
Computes Accuracy, Precision, Recall, F1 Score, Confusion Matrix, and Latency.
Usage:
  python evaluation/evaluate.py --model gemma3 --data data/test_messages.json
  python evaluation/evaluate.py --local-only --data data/test_messages.json
"""

import sys
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.checker import check_with_ollama, analyze_locally

FLAGGED = {"SCAM", "SUSPICIOUS", "UNKNOWN"}

def calculate_metrics(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(results)
    tp = fp = tn = fn = unknowns = 0
    total_seconds = 0.0
    wrong = []

    for r in results:
        verdict = r.get("verdict", "UNKNOWN")
        label = r.get("label", "SAFE")
        flagged = verdict in FLAGGED
        is_scam = (label == "SCAM")
        sec = r.get("seconds", 0.0)
        total_seconds += sec

        if verdict == "UNKNOWN":
            unknowns += 1

        if flagged and is_scam:
            tp += 1
        elif not flagged and not is_scam:
            tn += 1
        elif flagged and not is_scam:
            fp += 1
            wrong.append({"type": "False Alarm (FP)", **r})
        elif not flagged and is_scam:
            fn += 1
            wrong.append({"type": "Missed Scam (FN)", **r})

    correct = tp + tn
    accuracy = round(100.0 * correct / total, 1) if total else 0.0
    precision = round(100.0 * tp / (tp + fp), 1) if (tp + fp) else 0.0
    recall = round(100.0 * tp / (tp + fn), 1) if (tp + fn) else 0.0
    f1 = round(2 * precision * recall / (precision + recall), 1) if (precision + recall) else 0.0
    avg_sec = round(total_seconds / total, 2) if total else 0.0

    return {
        "total": total,
        "correct": correct,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "false_alarms": fp,
        "missed_scams": fn,
        "unknowns": unknowns,
        "avg_seconds": avg_sec,
        "confusion_matrix": {
            "true_positive": tp,
            "false_positive": fp,
            "true_negative": tn,
            "false_negative": fn
        },
        "wrong_samples": wrong
    }

def run_evaluation(model: str, dataset_path: str, local_only: bool = False) -> Dict[str, Any]:
    with open(dataset_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"\n--- Running evaluation on {len(records)} messages (Dataset: {dataset_path}) ---")
    results = []

    for idx, item in enumerate(records, 1):
        msg = item["text"]
        label = item["label"]
        t0 = time.time()

        if local_only or model == "local":
            res = analyze_locally(msg)
        else:
            try:
                res = check_with_ollama(msg, model=model)
            except Exception as e:
                print(f"\n[Warning] Ollama failed on item {idx}: {e}. Falling back to local rules.")
                res = analyze_locally(msg)

        elapsed = round(time.time() - t0, 3)
        results.append({
            "id": item.get("id", f"msg-{idx}"),
            "text": msg,
            "label": label,
            "verdict": res.get("verdict", "UNKNOWN"),
            "seconds": elapsed
        })
        print(f"[{idx}/{len(records)}] {item.get('label')} -> {res.get('verdict')}", end="\r")

    print()
    return calculate_metrics(results)

def main():
    parser = argparse.ArgumentParser(description="Evaluate Scam Checker model performance")
    parser.add_argument("--model", type=str, default="gemma3", help="Model name (e.g. gemma3, gemma3:1b, local)")
    parser.add_argument("--data", type=str, default="data/test_messages.json", help="Path to JSON test dataset")
    parser.add_argument("--local-only", action="store_true", help="Force local heuristic engine")
    parser.add_argument("--output", type=str, default="evaluation/results.json", help="Path to write evaluation results")

    args = parser.parse_args()

    metrics = run_evaluation(args.model, args.data, local_only=args.local_only)

    print("\n" + "=" * 60)
    print("                EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Model Evaluated     : {args.model}")
    print(f"Total Test Messages : {metrics['total']}")
    print(f"Accuracy            : {metrics['accuracy']}% ({metrics['correct']}/{metrics['total']})")
    print(f"Precision           : {metrics['precision']}%")
    print(f"Recall (Sensitivity): {metrics['recall']}%")
    print(f"F1 Score            : {metrics['f1_score']}%")
    print(f"False Alarms (FP)   : {metrics['false_alarms']}")
    print(f"Missed Scams (FN)   : {metrics['missed_scams']}")
    print(f"Average Latency     : {metrics['avg_seconds']}s")
    print("-" * 60)
    print("Confusion Matrix:")
    print(f"  TP: {metrics['confusion_matrix']['true_positive']} | FP: {metrics['confusion_matrix']['false_positive']}")
    print(f"  FN: {metrics['confusion_matrix']['false_negative']} | TN: {metrics['confusion_matrix']['true_negative']}")
    print("=" * 60)

    # Save results
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
    print(f"\nFull evaluation metrics saved to {out_path}")

if __name__ == "__main__":
    main()
