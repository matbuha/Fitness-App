import random
import streamlit as st
from yt_extractor import get_info
import database_service as dbs

query_params = st.query_params

# אם בפרמטרי ה-URL נמצא access_token והמשתמש עדיין לא נשמר ב-session, נשמור אותו
if "access_token" in query_params and "user" not in st.session_state:
    st.session_state["user"] = query_params["access_token"][0]

# בדיקה אם המשתמש מאומת – אם לא, נעצור את הרצת הקוד ונציג הודעה
if "user" not in st.session_state:
    st.warning("You are not authenticated. Please sign in using the login page.")
    st.markdown("[Go to Login Page](https://matbuha-fitness-app.streamlit.app/auth.html)")
    st.stop()


@st.cache_data
def get_workouts():
    return dbs.get_all_workouts()

def get_duration_text(duration_s):
    seconds = duration_s % 60
    minutes = int((duration_s / 60) % 60)
    hours = int((duration_s / (60*60)) % 24)
    text = ''
    if hours > 0:
        text += f'{hours:02d}:{minutes:02d}:{seconds:02d}'
    else:
        text += f'{minutes:02d}:{seconds:02d}'
    return text

st.title("Workout App")

menu_options = ("Today's workout", "All workouts", "Add workout")
selection = st.sidebar.selectbox("Menu", menu_options)

if selection == "All workouts":
    st.markdown(f"## All workouts")
    
    workouts = get_workouts()
    for wo in workouts:
        url = "https://youtu.be/" + wo["video_id"]
        st.text(wo['title'])
        st.text(f"{wo['channel']} - {get_duration_text(wo['duration'])}")
        
        ok = st.button('Delete workout', key=wo["video_id"])
        if ok:
            dbs.delete_workout(wo["video_id"])
            st.cache_data.clear()
            st.experimental_rerun()
            
        st.video(url)
    else:
        st.text("No workouts in Database!")
elif selection == "Add workout":
    st.markdown(f"## Add workout")
    
    url = st.text_input('Please enter the video url')
    if url:
        workout_data = get_info(url)
        if workout_data is None:
            st.text("Could not find video")
        else:
            st.text(workout_data['title'])
            st.text(workout_data['channel'])
            st.video(url)
            if st.button("Add workout"):
                dbs.insert_workout(workout_data)
                st.text("Added workout!")
                st.cache_data.clear()
else:
    st.markdown(f"## Today's workout")
    
    workouts = get_workouts()
    if not workouts:
        st.text("No workouts in Database!")
    else:
        wo = dbs.get_workout_today()
        
        if not wo:
            # not yet defined
            workouts = get_workouts()
            n = len(workouts)
            idx = random.randint(0, n-1)
            wo = workouts[idx]
            dbs.update_workout_today(wo, insert=True)

        
        if st.button("Choose another workout"):
            workouts = get_workouts()
            n = len(workouts)
            if n > 1:
                idx = random.randint(0, n-1)
                wo_new = workouts[idx]
                while wo_new['video_id'] == wo['video_id']:
                    idx = random.randint(0, n-1)
                    wo_new = workouts[idx]
                wo = wo_new
                dbs.update_workout_today(wo)
        
        url = "https://youtu.be/" + wo["video_id"]
        st.text(wo['title'])
        st.text(f"{wo['channel']} - {get_duration_text(wo['duration'])}")
        st.video(url)
    