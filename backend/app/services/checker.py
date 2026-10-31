import re
import json
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

SYSTEM_PROMPT = """You are a cybersecurity specialist helping everyday citizens and elderly relatives in India decide if an SMS, WhatsApp, or email message is a scam.
You must reply with ONE valid JSON object and nothing else, with exactly these keys:
"verdict": "SCAM", "SUSPICIOUS" or "SAFE"
"summary": one short sentence in simple Hinglish (Hindi in English letters) or English summarizing the verdict
"explanation": one or two short sentences explaining why, in simple terms without confusing jargon
"warning_signs": array of short warning signs identified (e.g. ["Urgency", "Phishing link", "OTP request"])
"suspicious_indicators": array of objects with "text" (exact phrase from message) and "reason" (why concerning)
"recommended_actions": array of practical immediate safety steps

Warning signs: urgency or threats, asking for OTP, PIN or password, links to unknown sites, KYC or account-block threats, police/CBI/customs/courier-parcel threats, prizes, jobs that pay for simple tasks, requests to install an app or send money.
Normal messages: bank alerts that only inform, OTP messages that say not to share the OTP, delivery updates, bill reminders, messages from family that ask for nothing risky.
If a message pressures the reader to send money, share an OTP or click a link, it is SCAM.
If you are unsure, say SUSPICIOUS.
IMPORTANT: write "explanation", "summary", and "recommended_actions" in simple Hinglish or clear English."""

FEW_SHOT = [
    {
        "role": "user",
        "content": 'Message:\n"""Your Paytm KYC has expired. Click http://paytm-kyc.example to avoid account freeze."""'
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "verdict": "SCAM",
            "summary": "Khatra! Yeh message account freeze ka darr dekar fake link kholne ko keh raha hai.",
            "explanation": "Yeh message account band hone ki dhamki deta hai aur anjaan link par click karne ko kehta hai. Asli company aisa nahi karti.",
            "warning_signs": ["Urgency", "Phishing link", "KYC freeze threat"],
            "suspicious_indicators": [
                {"text": "http://paytm-kyc.example", "reason": "Anjaan website link jo Paytm ki official site nahi hai."},
                {"text": "avoid account freeze", "reason": "Darr aur jaldbaazi paida karne ke liye dhamki."}
            ],
            "recommended_actions": [
                "Link par click mat karo.",
                "Card par likhe number se company ko call karke poochho."
            ]
        }, ensure_ascii=False)
    },
    {
        "role": "user",
        "content": 'Message:\n"""Your Swiggy order is out for delivery and will reach you in 15 minutes."""'
    },
    {
        "role": "assistant",
        "content": json.dumps({
            "verdict": "SAFE",
            "summary": "Surakshit lag raha hai. Yeh delivery ki aam notification hai.",
            "explanation": "Yeh sirf order ki jaankari hai. Isme paisa, OTP ya link nahi maanga gaya.",
            "warning_signs": [],
            "suspicious_indicators": [],
            "recommended_actions": [
                "Kuch karne ki zaroorat nahi."
            ]
        }, ensure_ascii=False)
    }
]

def analyze_locally(message: str, language: str = "hinglish") -> Dict[str, Any]:
    raw = message.strip()
    text = raw.lower()

    url_matches = re.findall(r"https?://[^\s]+|bit\.ly/[^\s]+|tinyurl\.com/[^\s]+|t\.me/[^\s]+|[a-zA-Z0-9-]+\.(?:xyz|top|site|club|vip|online|info|ru|link|pw|icu|app)\b[^\s]*", raw, re.IGNORECASE)
    urgency_match = re.search(r"(immediately|turant|tonight|aaj raat|within 24 hours|expire|suspended|deactivated|permanent block|court summon|arrest warrant|urgent)", raw, re.IGNORECASE)
    remote_app = re.search(r"(anydesk|teamviewer|quicksupport|rustdesk|install app|\.apk)", raw, re.IGNORECASE)
    electricity = re.search(r"(electricity|bijli|power supply|disconnected|disconnection tonight|bill pending)", raw, re.IGNORECASE)
    digital_arrest = re.search(r"(customs|cbi|police|narcotics|parcel seized|illegal goods|arrest warrant|court notice|digital arrest)", raw, re.IGNORECASE)
    lottery = re.search(r"(congratulations|you have won|lottery|lucky draw|winner|kbc|kaun banega|reward points|gift card|claim prize)", raw, re.IGNORECASE)
    job = re.search(r"(part time job|earn money|earn daily|telegram|youtube like|review tasks|work from home|daily 3000|daily 5000|@earndaily)", raw, re.IGNORECASE)
    kyc = re.search(r"(kyc|pan update|pan card|aadhaar|account block|account suspended|deactivated|freeze|hold)", raw, re.IGNORECASE)

    asks_otp = (bool(re.search(r"(otp|one time password|pin|cvv|password|passcode)", text)) and
                bool(re.search(r"(share|send|bhejo|tell|enter|submit|batayein|verify|disclose)", text)) and
                not bool(re.search(r"(never share|do not share|kisi ke sath share na|confidential|do not disclose)", text)))

    is_otp_note = bool(re.search(r"(otp|one-time password|verification code|verification password) is [0-9]{4,8}|[0-9]{4,8} is your (otp|verification|one-time)", text))
    says_do_not_share = bool(re.search(r"(do not share|never share|not to be shared|kisi ke sath share na|confidential|do not disclose)", text))
    bank_debit = bool(re.search(r"(debited by|credited to|spent at|a/c no|bal:?|avl bal|inr [0-9]+|rs\.? [0-9]+|savings a/c|salary of)", text))
    delivery_note = bool(re.search(r"(out for delivery|delivered|dispatched|courier|tracking id|order placed|swiggy|zomato|amazon|flipkart)", text)) and not url_matches
    is_safe_utility = bool(re.search(r"(recharge on|thanks app|consumer portal|official app|due date is|airtel thanks|bill for|subscriber id)", text)) and not url_matches
    is_family_personal = bool(re.search(r"(papa|maa|mummy|bhai|train me|station|office me|presentation|late ho jaunga|dinner|auto le kar|doctor|dr\.|appointment)", text)) and not url_matches

    is_elec_scam = bool(electricity and re.search(r"(disconnected|disconnection tonight|tonight at|immediately contact|officer at|contact.*officer|9[0-9]{9})", raw, re.IGNORECASE))
    is_genuine_elec = bool(re.search(r"(consumer no|consumer id|meter no|bill generated|due date is|official app|consumer portal)", raw, re.IGNORECASE))

    indicators = []
    warning_signs = []

    if url_matches:
        for u in url_matches:
            warning_signs.append("Unverified link")
            indicators.append({"text": u, "reason": "Anjaan website link jo scam page par le ja sakta hai.", "severity": "critical"})

    if urgency_match and not is_safe_utility and not is_family_personal:
        warning_signs.append("Urgency / Pressure deadline")
        indicators.append({"text": urgency_match.group(0), "reason": "Jaldbaazi paida karke bina soche kaam karwane ki koshish.", "severity": "high"})

    if asks_otp:
        warning_signs.append("OTP / Credentials requested")
        indicators.append({"text": "OTP / PIN request", "reason": "Bank ya koi bhi genuine company kabhi OTP nahi maangti.", "severity": "critical"})

    if remote_app:
        warning_signs.append("Remote desktop installation")
        indicators.append({"text": remote_app.group(0), "reason": "AnyDesk ya APK se scammer aapka poora phone access kar sakta hai.", "severity": "critical"})

    if is_elec_scam and not is_genuine_elec:
        warning_signs.append("Electricity disconnection threat")
        indicators.append({"text": electricity.group(0) if electricity else "Electricity disconnection", "reason": "Bijli katne ka darr dikhakar fraud number par call karwane ki koshish.", "severity": "critical"})

    if digital_arrest:
        warning_signs.append("Digital arrest extortion")
        indicators.append({"text": digital_arrest.group(0), "reason": "CBI/Police ke farzi naam par blackmail karne ka scam.", "severity": "critical"})

    if lottery:
        warning_signs.append("Lottery prize scam")
        indicators.append({"text": lottery.group(0), "reason": "Bina ticket ke laakhon jeetne ka jhootha laalach.", "severity": "high"})

    if job:
        warning_signs.append("Part-time job fraud")
        indicators.append({"text": job.group(0), "reason": "Telegram par task karke paise kamane ka fraud scheme.", "severity": "high"})

    if kyc and (url_matches or urgency_match):
        warning_signs.append("Banking KYC threat")
        indicators.append({"text": kyc.group(0), "reason": "Bank KYC expire hone ki dhamki dekar account hack karne ki koshish.", "severity": "critical"})

    if indicators:
        verdict = "SCAM"
        summary = "Khatra! Yeh message ek scam/fraud ki koshish lagta hai."
        explanation = "Is message me scam ke aam tareeqe jaise nakli link kholna, darr dikhana ya OTP maangna paya gaya hai."
        actions = [
            "Kisi bhi link par bilkul click mat karein.",
            "OTP, PIN ya paise kisi ko na bhejein.",
            "Sender ko block karein aur 1930 Cyber Helpline par report karein."
        ]
    elif is_otp_note and says_do_not_share:
        verdict = "SAFE"
        summary = "Surakshit lag raha hai. Asli OTP alert lagta hai."
        explanation = "Isme OTP kisi ko na batane ki hidayat di gayi hai aur koi anjaan link nahi hai."
        actions = [
            "Agar aapne khud shuru kiya tha to hi OTP use karein. Kisi ko batayein nahi."
        ]
    elif bank_debit or delivery_note or is_safe_utility or is_family_personal:
        verdict = "SAFE"
        summary = "Surakshit lag raha hai. Yeh transaction, notification ya parivaar ka message hai."
        explanation = "Isme koi OTP, link ya paisa nahi maanga gaya hai."
        actions = [
            "Kuch karne ki zaroorat nahi hai. Apne records ke liye check karein."
        ]
    else:
        verdict = "SUSPICIOUS"
        summary = "Savdhaan! Yeh message sandehaspad lag raha hai."
        explanation = "Message me poori saaf jaankari nahi hai. Bina pakki tasdeeq ke kisi par vishwas na karein."
        actions = [
            "Samajh nahi aaya. Link, OTP ya paisa mat do; kisi bharosemand insaan se poochho."
        ]

    return {
        "verdict": verdict,
        "summary": summary,
        "explanation": explanation,
        "warning_signs": warning_signs,
        "suspicious_indicators": indicators,
        "recommended_actions": actions,
        "engine": "local_rule_engine"
    }

def check_with_ollama(message: str, model: str = "gemma3", host: str = "http://localhost:11434") -> Dict[str, Any]:
    import ollama
    client = ollama.Client(host=host)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *FEW_SHOT,
        {"role": "user", "content": f'Message:\n"""{message}"""'}
    ]

    resp = client.chat(
        model=model,
        messages=messages,
        format="json",
        options={"temperature": 0}
    )

    content = resp.get("message", {}).get("content", "")
    try:
        data = json.loads(content)
    except Exception:
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
        else:
            data = {}

    verdict = str(data.get("verdict", "")).strip().upper()
    if verdict not in {"SCAM", "SUSPICIOUS", "SAFE"}:
        verdict = "UNKNOWN"

    return {
        "verdict": verdict,
        "summary": str(data.get("summary") or data.get("reason", "Analysis complete.")),
        "explanation": str(data.get("explanation") or data.get("reason", "")),
        "warning_signs": data.get("warning_signs", []),
        "suspicious_indicators": data.get("suspicious_indicators", []),
        "recommended_actions": data.get("recommended_actions") or ([data.get("action")] if data.get("action") else []),
        "engine": f"ollama-{model}"
    }
