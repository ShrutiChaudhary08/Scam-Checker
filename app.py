"""Tiny local web page to hand to your relative. Run: streamlit run app.py"""
import streamlit as st

from checker import check_message

st.title("Message check")
st.caption("Yeh sab aapke apne laptop par chalta hai. Koi message internet par nahi jaata.")
msg = st.text_area("Message yahan paste karein", height=160)
if st.button("Check karein") and msg.strip():
    with st.spinner("Soch raha hoon..."):
        r = check_message(msg.strip())
    colour = {"SCAM": "red", "SUSPICIOUS": "orange", "SAFE": "green"}.get(r["verdict"], "gray")
    st.markdown(f"### :{colour}[{r['verdict']}]")
    st.write(r["reason"])
    st.write("**Ab kya karein:** " + r["action"])
    if r["verdict"] == "SAFE":
        st.info("SAFE ka matlab sirf itna hai ki yeh message scam jaisa nahi dikha. "
                "Link kholne, OTP dene ya paise bhejne se pehle phir bhi bank se confirm karein.")
    st.caption("Yeh sirf madad hai, guarantee nahi. Paise ka mamla ho to card par likhe number par bank ko call karein.")
