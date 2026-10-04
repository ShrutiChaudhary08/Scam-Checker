# Scam Checker: works offline, built for a friend

Submission for the **Hacktoberfest Weekend Challenge: Build for a Friend** (DEV, 2 to 5 October 2026).

A friend wanted a way for his father and himself to check whether the messages they get from banks and other senders are scams or genuine, so I built this for them.

You paste an SMS or WhatsApp message. The checker answers **SCAM**, **SUSPICIOUS** or **SAFE**, gives a short reason in simple Hinglish, and says what to do next. It runs on an ordinary laptop with **Gemma 3 through Ollama**. No message leaves the machine and it needs no internet after the model is downloaded.

## How it works
- `checker.py` sends the message to a local Gemma model through the Ollama Python library, asks for JSON, uses temperature 0, and includes two worked Hinglish examples in the prompt. Replies that are not valid JSON become `UNKNOWN`, which is treated as flagged.
- `evaluate.py` scores the checker on labelled test messages and saves a results table. Anything not clearly SAFE counts as flagged.
- `app.py` is a small Streamlit page to hand to a non-technical user. When the verdict is SAFE it adds a reminder that SAFE only means the message did not look like a scam, and to confirm with the bank before clicking, sharing an OTP or sending money.
- `tests/test_checker.py` has 14 unit tests (reply parsing, scoring, data files, the app's SAFE reminder). They do not need Ollama.

## Run it
1. Install [Ollama](https://ollama.com/download), then run `ollama pull gemma3` (and `ollama pull gemma3:1b` to compare).
2. `pip install -r requirements.txt`
3. Check one message: `python checker.py "Your bank account will be blocked today. Update KYC at bit.ly/xyz"`
4. Web page: `streamlit run app.py`
5. Tests: `python -m pytest -q`
6. Evaluate: `python evaluate.py gemma3 gemma3:1b` (add `--data test_messages_external.json` or `--data test_messages_inbox.json` for the other sets)

## Results
Tested on a Windows laptop with 16 GB RAM, using Ollama's default settings. TODO: add your CPU/GPU if you know it (Task Manager > Performance). Sets are small and kept separate because they come from different sources. Results are indicative, not proof of real-world accuracy.

| Set | Model | Result | Avg seconds |
|---|---|---|---|
| 24 hand-written messages (12 scam, 12 genuine) | gemma3 (4B) | 23/24 correct, 1 false alarm, 0 missed | 18.1 |
| | gemma3:1b | 20/24 correct, 4 false alarms, 0 missed | 7.91 |
| 7 public scam examples | gemma3 (4B) | 6/7 caught, 1 missed | 19.39 |
| | gemma3:1b | 7/7 caught | 8.51 |
| 3 genuine messages from the author's inbox | gemma3 (4B) | 1/3 correct, 2 flagged | 21.1 |
| | gemma3:1b | 0/3 correct, 3 flagged | 9.32 |

Raw results: `results.md` (hand-written set), `results_external.md`, `results_inbox.md` (and the matching `.json` files).

**What went wrong**
- Both models flagged a genuine one-time-password message and a genuine SBI debit alert as scams.
- The 4B model marked a fake "Did you initiate this? YES or NO" bank text as SAFE. The wording is almost identical to real bank fraud alerts, and the tool sees only the text, not the sender.
- In my test sets the 1B model never missed a scam, but it flagged nearly half of the genuine messages, so it is too cautious to rely on.
- Found in manual testing after the test runs (v1 prompt, default gemma3 4B model): "Dear customer, your electricity will be disconnected tonight due to pending bill. Contact support immediately" was marked SAFE. It has the usual scam pressure (disconnection tonight, contact immediately) and no consumer number, amount or due date, and the model's reason wrongly said it gave a support number. A similar message with a phone number was caught in the test set, so one missing detail changed the answer.

## Limitations
- Small, hand-picked test sets; not real-world validation.
- Text-only checking cannot verify who sent a message. It is a helper, not a guarantee. For anything involving money, call the bank on the number printed on your card.
- The two prompt examples are not in any test set, and the prompt was not tuned on the test sets. The submitted prompt is v1; I did not try to fix the failures above.

## Data and credits
- `test_messages.json`: written by the author with AI assistance, with made-up numbers and links.
- `test_messages_external.json`: scam texts transcribed from publicly shown examples (Berkeley Lab IT, Aura, Net Protector Antivirus, BankFive, Doing More Today; two sources not recorded), with links and numbers replaced by placeholders.
- `test_messages_inbox.json`: genuine messages from the author's own inbox, anonymised.
- Built with [Ollama](https://ollama.com) and Google's Gemma 3 open-weight model.

## Challenge notes
- Started and built during the challenge window (2 to 5 October 2026).
- An AI assistant (Claude) helped with planning and code.
- Commits made after the deadline (5 October 2026, 12:29 PM IST): none. TODO: update this line if you commit later.
