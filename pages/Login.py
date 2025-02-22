import streamlit as st
import streamlit.components.v1 as components
import os

st.title("Login / Sign Up")

st.write("אנא התחבר באמצעות Google כדי לגשת לאפליקציה.")

# טען את תוכן auth.html מתיקיית frontend
auth_html_path = os.path.join("frontend", "auth.html")
try:
    with open(auth_html_path, "r", encoding="utf-8") as f:
        auth_html = f.read()
except Exception as e:
    st.error(f"Could not load {auth_html_path}: {e}")
    st.stop()

# הטמעת תוכן ה-HTML בדף
components.html(auth_html, height=700, scrolling=True)

st.info("לאחר ההתחברות, תועבר אוטומטית לדף האפליקציה.")