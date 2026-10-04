"""Score the checker on test_messages.json. Usage: python evaluate.py gemma3 gemma3:1b"""
import json
import sys

from checker import FLAGGED, check_message


def score(results):
    """results: list of {label, verdict, seconds, text}. Flagged = not clearly SAFE."""
    total = len(results)
    correct = false_alarms = missed = unknown = 0
    seconds = 0.0
    wrong = []
    for r in results:
        flagged = r["verdict"] in FLAGGED
        is_scam = r["label"] == "SCAM"
        seconds += r.get("seconds", 0.0)
        unknown += r["verdict"] == "UNKNOWN"
        if flagged == is_scam:
            correct += 1
        else:
            wrong.append(r)
            if flagged:
                false_alarms += 1
            else:
                missed += 1
    return {
        "total": total,
        "correct": correct,
        "accuracy": round(100 * correct / total, 1) if total else 0.0,
        "false_alarms": false_alarms,
        "missed_scams": missed,
        "unknown": unknown,
        "avg_seconds": round(seconds / total, 2) if total else 0.0,
        "wrong": wrong,
    }


def run_model(model, rows):
    out = []
    for i, row in enumerate(rows, 1):
        res = check_message(row["text"], model)
        out.append({**row, **res})
        print(f"  [{model}] {i}/{len(rows)} done", end="\r")
    print()
    return score(out)


def parse_args(argv):
    """Returns (models, data_path, output_prefix). Optional: --data file.json"""
    argv = list(argv)
    path = "test_messages.json"
    if "--data" in argv:
        i = argv.index("--data")
        path = argv[i + 1]
        del argv[i:i + 2]
    stem = path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].removesuffix(".json").removeprefix("test_messages")
    prefix = "results" + (stem if stem else "")
    return (argv or ["gemma3"]), path, prefix


def run_all(models, rows):
    """Run each model; skip one that fails (e.g. not downloaded) instead of crashing."""
    summary = {}
    for m in models:
        try:
            summary[m] = run_model(m, rows)
        except Exception as e:  # noqa: BLE001
            print(f"\nSkipping {m}: {e}")
            print(f"If the model is not downloaded, run:  ollama pull {m}\n")
    return summary


if __name__ == "__main__":
    models, data_path, prefix = parse_args(sys.argv[1:])
    with open(data_path, encoding="utf-8") as f:
        rows = json.load(f)
    summary = run_all(models, rows)
    if not summary:
        sys.exit("No model could be run, so nothing was saved.")

    lines = ["| Model | Accuracy | False alarms | Missed scams | Unknown | Avg sec |",
             "|---|---|---|---|---|---|"]
    for m, s in summary.items():
        lines.append(f"| {m} | {s['accuracy']}% ({s['correct']}/{s['total']}) | "
                     f"{s['false_alarms']} | {s['missed_scams']} | {s['unknown']} | {s['avg_seconds']} |")
    table = "\n".join(lines)
    print("\n" + table)
    for m, s in summary.items():
        for w in s["wrong"]:
            print(f"\n[{m}] WRONG (true: {w['label']}, got: {w['verdict']}): {w['text'][:90]}")
    with open(prefix + ".md", "w", encoding="utf-8") as f:
        f.write(table + "\n")
    with open(prefix + ".json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {prefix}.md and {prefix}.json")
