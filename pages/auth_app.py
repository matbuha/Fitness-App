import streamlit as st
from supabase import create_client, Client
# אין צורך ב-webbrowser.open בסביבת פרודקשן – נשתמש בקישור לחיצה

# קריאה לנתונים שהוגדרו בקובץ הסודות דרך st.secrets
supabase_url = st.secrets["connections"]["supabase"]["SUPABASE_URL"]
supabase_key = st.secrets["connections"]["supabase"]["SUPABASE_KEY"]

# יצירת לקוח Supabase
supabase: Client = create_client(supabase_url, supabase_key)

st.title("Login / Sign Up with Google")

# אם המשתמש כבר מחובר – העבר אותו לדף הראשי
if "user" in st.session_state:
    st.success("You are already signed in!")
    st.markdown("[Go to App](https://matbuha-fitness-app.streamlit.app/)")
    st.stop()

# כפתור להתחברות עם Google
if st.button("Sign In with Google"):
    result = supabase.auth.sign_in(provider="google")
    if "error" in result and result["error"]:
        st.error("Error during sign in: " + result["error"].get("message", "Unknown error"))
    else:
        redirect_url = result.get("redirect_url")
        if redirect_url:
            st.success("Redirecting to Google for authentication...")
            st.markdown(f"[Click here if not redirected]({redirect_url})")
            # לא נשתמש ב-webbrowser.open – רק נציג קישור
        else:
            st.error("No redirect URL received. Check your Supabase settings.")
            
# בדיקת query parameters לאחר חזרה מגוגל
query_params = st.query_params()
if "access_token" in query_params:
    access_token = query_params["access_token"][0]
    # נניח כאן שה-token שקיבלת הוא ההוכחה שהמשתמש התחבר בהצלחה
    st.session_state["user"] = access_token
    st.success("Signed in successfully!")
    st.markdown("[Go to App](https://matbuha-fitness-app.streamlit.app/)")
    st.stop()

# אפשר להוסיף הוראות למשתמש במקרה שאין access_token
st.info("Please sign in using the button above to access the app.")
