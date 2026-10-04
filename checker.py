"""Scam message checker. Runs fully offline with a local Gemma model through Ollama."""
import json
import re
import sys
import time

DEFAULT_MODEL = "gemma3"
VERDICTS = {"SCAM", "SUSPICIOUS", "SAFE"}
FLAGGED = {"SCAM", "SUSPICIOUS", "UNKNOWN"}  # anything that is not clearly SAFE
FALLBACK_ACTION = "Samajh nahi aaya. Link, OTP ya paisa mat do; kisi bharosemand insaan se poochho."

SYSTEM_PROMPT = """You help an elderly person in India decide if an SMS or WhatsApp message is a scam.
Reply with ONE JSON object and nothing else, with exactly these keys:
"verdict": "SCAM", "SUSPICIOUS" or "SAFE"
"reason": one or two short sentences in simple Hinglish (Hindi written in English letters) saying why
"action": one short sentence in simple Hinglish saying what to do now

Warning signs: urgency or threats, asking for OTP, PIN or password, links to unknown sites, KYC or account-block threats, police/CBI/customs/courier-parcel threats, prizes, jobs that pay for simple tasks, requests to install an app or send money.
Normal messages: bank alerts that only inform, OTP messages that say not to share the OTP, delivery updates, bill reminders, messages from family that ask for nothing risky.
If a message pressures the reader to send money, share an OTP or click a link, it is SCAM.
If you are unsure, say SUSPICIOUS.
IMPORTANT: write "reason" and "action" in Hinglish (Hindi in English letters), never in plain English."""

# Two worked examples so the model copies the Hinglish style. They are NOT in test_messages.json.
FEW_SHOT = [
    {"role": "user", "content": 'Message:\n"""Your Paytm KYC has expired. Click http://paytm-kyc.example to avoid account freeze."""'},
    {"role": "assistant", "content": json.dumps({
        "verdict": "SCAM",
        "reason": "Yeh message account band hone ki dhamki deta hai aur anjaan link par click karne ko kehta hai. Asli company aisa nahi karti.",
        "action": "Link par click mat karo. Card par likhe number se company ko call karke poochho."}, ensure_ascii=False)},
    {"role": "user", "content": 'Message:\n"""Your Swiggy order is out for delivery and will reach you in 15 minutes."""'},
    {"role": "assistant", "content": json.dumps({
        "verdict": "SAFE",
        "reason": "Yeh sirf order ki jaankari hai. Isme paisa, OTP ya link nahi maanga gaya.",
        "action": "Kuch karne ki zaroorat nahi."}, ensure_ascii=False)},
]


def parse_response(text):
    """Turn the model's reply into a clean dict. Never raises."""
    data = None
    try:
        data = json.loads(text)
    except (json.JSONDecodeError, TypeError):
        match = re.search(r"\{.*\}", text or "", re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
            except json.JSONDecodeError:
                data = None
    if not isinstance(data, dict):
        return {"verdict": "UNKNOWN", "reason": "", "action": FALLBACK_ACTION}
    verdict = str(data.get("verdict", "")).strip().upper()
    if verdict not in VERDICTS:
        verdict = "UNKNOWN"
    return {
        "verdict": verdict,
        "reason": str(data.get("reason", "")).strip(),
        "action": str(data.get("action", "")).strip() or FALLBACK_ACTION,
    }


def check_message(message, model=DEFAULT_MODEL):
    import ollama  # imported here so tests run without Ollama installed

    start = time.time()
    resp = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *FEW_SHOT,
            {"role": "user", "content": 'Message:\n"""' + message + '"""'},
        ],
        format="json",
        options={"temperature": 0},
    )
    result = parse_response(resp["message"]["content"])
    result["seconds"] = round(time.time() - start, 2)
    return result


def show(result):
    print(f"Verdict : {result['verdict']}")
    print(f"Reason  : {result['reason']}")
    print(f"Action  : {result['action']}")
    print(f"Time    : {result['seconds']}s")


if __name__ == "__main__":
    model = DEFAULT_MODEL
    if len(sys.argv) > 1:
        show(check_message(" ".join(sys.argv[1:]), model))
    else:
        print(f"Paste a message and press Enter (model: {model}). Ctrl+C to quit.")
        while True:
            text = input("\nMessage> ").strip()
            if text:
                show(check_message(text, model))
