import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.checker import analyze_locally

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "Scam Checker API"

def test_analyze_empty_message():
    response = client.post("/api/analyze", json={"message": "   "})
    assert response.status_code == 422 or response.status_code == 400

def test_analyze_local_scam():
    response = client.post("/api/analyze", json={
        "message": "Dear customer, your Paytm KYC has expired. Click http://paytm-kyc.example to avoid account freeze.",
        "prefer_local": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "SCAM"
    assert len(data["warning_signs"]) > 0
    assert len(data["suspicious_indicators"]) > 0
    assert len(data["recommended_actions"]) > 0
    assert data["engine"] == "local_rule_engine"

def test_analyze_local_safe():
    response = client.post("/api/analyze", json={
        "message": "Your Swiggy order is out for delivery and will reach you in 15 minutes.",
        "prefer_local": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "SAFE"
    assert len(data["recommended_actions"]) > 0

def test_analyze_local_otp_safe():
    response = client.post("/api/analyze", json={
        "message": "849201 is your OTP for login on Tata Neu. Do not share OTP with anyone.",
        "prefer_local": True
    })
    assert response.status_code == 200
    assert response.json()["verdict"] == "SAFE"

def test_analyze_with_mocked_ollama():
    mock_ollama_resp = {
        "message": {
            "content": '{"verdict": "SCAM", "summary": "Phishing fraud attempt", "explanation": "Urgent KYC threat", "warning_signs": ["Urgency"], "suspicious_indicators": [{"text": "http://example.com", "reason": "Phishing"}], "recommended_actions": ["Do not click"]}'
        }
    }
    with patch("ollama.Client.chat", return_value=mock_ollama_resp):
        response = client.post("/api/analyze", json={
            "message": "Urgent: verify KYC at http://example.com",
            "model": "gemma3",
            "prefer_local": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] == "SCAM"
        assert data["summary"] == "Phishing fraud attempt"

def test_analyze_ollama_fallback():
    # If Ollama throws connection error, backend falls back gracefully
    with patch("ollama.Client.chat", side_effect=ConnectionError("Ollama offline")):
        response = client.post("/api/analyze", json={
            "message": "Congratulations! You won Rs 25,00,000 in KBC Lottery. Send Rs 1500 fee.",
            "prefer_local": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] == "SCAM"
        assert data["is_fallback"] is True

def test_models_list():
    response = client.get("/api/models")
    assert response.status_code == 200
    assert "models" in response.json()
    assert len(response.json()["models"]) >= 1

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
