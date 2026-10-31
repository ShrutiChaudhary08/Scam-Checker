import unittest
from backend.app.services.checker import analyze_locally

class TestScamChecker(unittest.TestCase):
    def test_scam_paytm_kyc(self):
        msg = "Dear customer, your Paytm KYC has expired. Click http://paytm-kyc.example to avoid account freeze."
        res = analyze_locally(msg)
        self.assertEqual(res["verdict"], "SCAM")
        self.assertGreater(len(res["warning_signs"]), 0)
        self.assertGreater(len(res["suspicious_indicators"]), 0)

    def test_scam_electricity_cut(self):
        msg = "Dear Customer, your electricity power will be disconnected tonight at 9:30 PM. Contact officer at 9876543210."
        res = analyze_locally(msg)
        self.assertEqual(res["verdict"], "SCAM")

    def test_scam_digital_arrest(self):
        msg = "Mumbai Customs: Parcel seized with narcotics. Digital arrest warrant issued by CBI. Join Skype call."
        res = analyze_locally(msg)
        self.assertEqual(res["verdict"], "SCAM")

    def test_safe_swiggy_delivery(self):
        msg = "Your Swiggy order is out for delivery and will reach you in 15 minutes."
        res = analyze_locally(msg)
        self.assertEqual(res["verdict"], "SAFE")

    def test_safe_otp_reminder(self):
        msg = "849201 is your OTP for login on Tata Neu. Do not share OTP with anyone."
        res = analyze_locally(msg)
        self.assertEqual(res["verdict"], "SAFE")

    def test_safe_bank_debit_alert(self):
        msg = "Dear Customer, Rs 1,450.00 debited from A/c XX4091 on 15-Oct-26 at DMART. Avl Bal: Rs 42,390.50. Call 1800112211 if not done by you - SBI."
        res = analyze_locally(msg)
        self.assertEqual(res["verdict"], "SAFE")

    def test_safe_genuine_electricity_bill(self):
        msg = "Your electricity bill of Rs 1,840 for Consumer No 0492817293 is generated. Due date is 25-Oct-26. Pay via BESCOM consumer portal."
        res = analyze_locally(msg)
        self.assertEqual(res["verdict"], "SAFE")

if __name__ == "__main__":
    unittest.main()
