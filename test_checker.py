import json
import os
import sys
import types

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import checker
from evaluate import score


def test_parse_clean_json():
    r = checker.parse_response('{"verdict": "scam", "reason": "OTP maanga hai", "action": "Call mat karo"}')
    assert r == {"verdict": "SCAM", "reason": "OTP maanga hai", "action": "Call mat karo"}


def test_parse_json_wrapped_in_text():
    r = checker.parse_response('Sure! ```json\n{"verdict": "SAFE", "reason": "r", "action": "a"}\n```')
    assert r["verdict"] == "SAFE"


def test_parse_garbage_gives_unknown_with_safe_action():
    for bad in ["not json at all", "", None, "[1,2]", '{"verdict": "MAYBE"}']:
        r = checker.parse_response(bad)
        assert r["verdict"] == "UNKNOWN"
        assert r["action"] == checker.FALLBACK_ACTION


def test_check_message_uses_ollama(monkeypatch):
    calls = {}

    def fake_chat(**kwargs):
        calls.update(kwargs)
        return {"message": {"content": '{"verdict": "SUSPICIOUS", "reason": "x", "action": "y"}'}}

    monkeypatch.setitem(sys.modules, "ollama", types.SimpleNamespace(chat=fake_chat))
    r = checker.check_message("hello", model="gemma3:1b")
    assert r["verdict"] == "SUSPICIOUS" and "seconds" in r
    assert calls["model"] == "gemma3:1b" and calls["options"]["temperature"] == 0


def test_score_counts():
    results = [
        {"label": "SCAM", "verdict": "SCAM", "seconds": 1, "text": "a"},
        {"label": "SCAM", "verdict": "SAFE", "seconds": 1, "text": "b"},      # missed
        {"label": "SAFE", "verdict": "SUSPICIOUS", "seconds": 1, "text": "c"},  # false alarm
        {"label": "SAFE", "verdict": "SAFE", "seconds": 1, "text": "d"},
        {"label": "SCAM", "verdict": "UNKNOWN", "seconds": 1, "text": "e"},    # unknown counts as flagged
    ]
    s = score(results)
    assert (s["total"], s["correct"], s["missed_scams"], s["false_alarms"], s["unknown"]) == (5, 3, 1, 1, 1)
    assert s["accuracy"] == 60.0 and s["avg_seconds"] == 1.0


def test_dataset_is_balanced_and_valid():
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_messages.json")
    rows = json.load(open(path, encoding="utf-8"))
    labels = [r["label"] for r in rows]
    assert set(labels) == {"SCAM", "SAFE"}
    assert labels.count("SCAM") == labels.count("SAFE") == 12
    assert len({r["text"] for r in rows}) == len(rows)


def test_few_shot_examples_are_valid_and_not_in_test_set():
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_messages.json")
    test_texts = " ".join(r["text"] for r in json.load(open(path, encoding="utf-8")))
    assert len(checker.FEW_SHOT) == 4
    for i in (1, 3):
        assert checker.parse_response(checker.FEW_SHOT[i]["content"])["verdict"] in {"SCAM", "SAFE"}
    for i in (0, 2):
        example = checker.FEW_SHOT[i]["content"].split('"""')[1]
        assert example not in test_texts  # no leakage into the evaluation


def test_examples_are_sent_to_model(monkeypatch):
    calls = {}

    def fake_chat(**kwargs):
        calls.update(kwargs)
        return {"message": {"content": '{"verdict": "SAFE", "reason": "r", "action": "a"}'}}

    monkeypatch.setitem(sys.modules, "ollama", types.SimpleNamespace(chat=fake_chat))
    checker.check_message("hi")
    roles = [m["role"] for m in calls["messages"]]
    assert roles == ["system", "user", "assistant", "user", "assistant", "user"]


def test_missing_model_is_skipped_not_fatal(monkeypatch, capsys):
    import evaluate

    def fake_check(text, model):
        if model == "missing":
            raise RuntimeError("model 'missing' not found (status code: 404)")
        return {"verdict": "SAFE", "reason": "", "action": "", "seconds": 1.0}

    monkeypatch.setattr(evaluate, "check_message", fake_check)
    rows = [{"text": "a", "label": "SAFE"}, {"text": "b", "label": "SCAM"}]
    summary = evaluate.run_all(["good", "missing"], rows)
    assert list(summary) == ["good"]
    assert summary["good"]["correct"] == 1 and summary["good"]["missed_scams"] == 1
    assert "ollama pull missing" in capsys.readouterr().out


def test_parse_args_defaults_and_data_flag():
    import evaluate
    assert evaluate.parse_args([]) == (["gemma3"], "test_messages.json", "results")
    assert evaluate.parse_args(["gemma3", "gemma3:1b"])[0] == ["gemma3", "gemma3:1b"]
    models, path, prefix = evaluate.parse_args(["gemma3", "--data", "test_messages_external.json"])
    assert (models, path, prefix) == (["gemma3"], "test_messages_external.json", "results_external")


def test_external_set_is_clean():
    base = os.path.dirname(os.path.dirname(__file__))
    ext = json.load(open(os.path.join(base, "test_messages_external.json"), encoding="utf-8"))
    main = {r["text"] for r in json.load(open(os.path.join(base, "test_messages.json"), encoding="utf-8"))}
    assert len(ext) == 7 and all(r["label"] == "SCAM" and r["source"] for r in ext)
    assert len({r["text"] for r in ext}) == len(ext) and not (main & {r["text"] for r in ext})
    assert not any("ngrok" in r["text"] or "+91" in r["text"] for r in ext)
    prompt = " ".join(m["content"] for m in checker.FEW_SHOT)
    assert not any(r["text"] in prompt for r in ext)


def test_inbox_set_is_clean_and_anonymised():
    import re
    base = os.path.dirname(os.path.dirname(__file__))
    rows = json.load(open(os.path.join(base, "test_messages_inbox.json"), encoding="utf-8"))
    others = set()
    for name in ("test_messages.json", "test_messages_external.json"):
        others |= {r["text"] for r in json.load(open(os.path.join(base, name), encoding="utf-8"))}
    assert len(rows) == 3 and all(r["label"] == "SAFE" for r in rows)
    assert not (others & {r["text"] for r in rows})
    # no personal phone or reference numbers; public 1800 toll-free helplines are allowed
    assert not any(re.search(r"(?<!\d)(?!1800)\d{9,}", r["text"]) for r in rows)


def _run_app(monkeypatch, verdict):
    pytest = __import__("pytest")
    pytest.importorskip("streamlit")
    from streamlit.testing.v1 import AppTest

    reply = '{"verdict": "%s", "reason": "kuch reason", "action": "kuch karo"}' % verdict
    fake = types.SimpleNamespace(chat=lambda **kw: {"message": {"content": reply}})
    monkeypatch.setitem(sys.modules, "ollama", fake)
    base = os.path.dirname(os.path.dirname(__file__))
    at = AppTest.from_file(os.path.join(base, "app.py"), default_timeout=30).run()
    at.text_area[0].set_value("test message").run()
    at.button[0].click().run()
    assert not at.exception
    return at


def test_app_safe_verdict_shows_extra_caution(monkeypatch):
    at = _run_app(monkeypatch, "SAFE")
    assert any("scam jaisa nahi dikha" in i.value for i in at.info)


def test_app_scam_verdict_has_no_safe_caution(monkeypatch):
    at = _run_app(monkeypatch, "SCAM")
    assert len(at.info) == 0
