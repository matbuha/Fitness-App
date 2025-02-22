import streamlit as st
import psycopg2.extras
from dotenv import load_dotenv
import os
from yt_extractor import get_info

# טעינת משתני סביבה מתוך .env


def get_connection():
    # נסה לקרוא מהסודות של Streamlit (שיקראו את הקובץ .streamlit/secrets.toml)
    if "database" in st.secrets:
        db_config = st.secrets["database"]
        return psycopg2.connect(
            user=db_config["user"],
            password=db_config["password"],
            host=db_config["host"],
            port=db_config["port"],
            dbname=db_config["dbname"]
        )
    else:
        # במקרה של סביבה מקומית עם קובץ .env
        return psycopg2.connect(
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port"),
            dbname=os.getenv("dbname")
        )

def insert_workout(workout_data):
    """
    פונקציה להוספת רשומה לטבלת workouts.
    workout_data הוא מילון עם המפתחות שמתאימים לעמודות בטבלה.
    """
    # בניית שאילתת INSERT דינאמית
    columns = workout_data.keys()  # רשימת שמות העמודות
    values = tuple(workout_data[col] for col in columns)
    columns_str = ", ".join(columns)
    placeholders = ", ".join(["%s"] * len(columns))
    query = f"INSERT INTO {SCHEMA}.{TABLE} ({columns_str}) VALUES ({placeholders}) RETURNING *;"
    
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(query, values)
        inserted = cur.fetchone()
        conn.commit()
        cur.close()
        return inserted
    except Exception as e:
        print("Error in insert_workout:", e)
        conn.rollback()
    finally:
        conn.close()

def delete_workout(workout_id):
    """
    פונקציה למחיקת רשומה מטבלת workouts לפי video_id.
    """
    query = f"DELETE FROM {SCHEMA}.{TABLE} WHERE video_id = %s RETURNING *;"
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(query, (workout_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        return deleted
    except Exception as e:
        print("Error in delete_workout:", e)
        conn.rollback()
    finally:
        conn.close()

def get_all_workouts():
    """
    פונקציה לקבלת כל הרשומות מטבלת workouts.
    בחרנו לעדכן את השאילתה כך שתביא עמודות video_id, channel, title, duration.
    """
    query = f"SELECT video_id, channel, title, duration FROM {SCHEMA}.{TABLE};"
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        return rows
    except Exception as e:
        print("Error in get_all_workouts:", e)
    finally:
        conn.close()

def get_workout_today():
    """
    פונקציה לקבלת הרשומה מ-workout_today שבה id שווה ל-0.
    """
    query = f"SELECT * FROM {SCHEMA}.{TABLE_TODAY} WHERE id = %s;"
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(query, (0,))
        row = cur.fetchone()
        cur.close()
        return row
    except Exception as e:
        print("Error in get_workout_today:", e)
    finally:
        conn.close()

def update_workout_today(workout_data, insert=False):
    """
    אם insert=True - מוסיפים רשומה חדשה לטבלת workout_today עם id=0.
    אחרת, מעדכנים את הרשומה הקיימת.
    """
    # דואגים ש-id יהיה 0
    workout_data['id'] = 0
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if insert:
            # INSERT דינאמי לטבלת workout_today
            columns = workout_data.keys()
            values = tuple(workout_data[col] for col in columns)
            columns_str = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))
            query = f"INSERT INTO {SCHEMA}.{TABLE_TODAY} ({columns_str}) VALUES ({placeholders}) RETURNING *;"
            cur.execute(query, values)
            result = cur.fetchone()
        else:
            # UPDATE דינאמי - מעדכנים את כל העמודות חוץ מ-id
            set_columns = [f"{col} = %s" for col in workout_data if col != "id"]
            values = tuple(workout_data[col] for col in workout_data if col != "id")
            query = f"UPDATE {SCHEMA}.{TABLE_TODAY} SET {', '.join(set_columns)} WHERE id = %s RETURNING *;"
            # מוסיפים את הערך של id לסוף הטאפל
            values = values + (workout_data['id'],)
            cur.execute(query, values)
            result = cur.fetchone()
        conn.commit()
        cur.close()
        return result
    except Exception as e:
        print("Error in update_workout_today:", e)
        conn.rollback()
    finally:
        conn.close()