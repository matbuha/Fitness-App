import psycopg2
from dotenv import load_dotenv
import os
from yt_extractor import get_info

# טעינת משתני סביבה מתוך .env
load_dotenv()

# משתנים להתחברות למסד הנתונים
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

SCHEMA = "workout_repo"
TABLE = "workouts"
TABLE_TODAY = "workout_today"

def get_connection():
    return psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
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
        cur = conn.cursor()
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
        cur = conn.cursor()
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
        cur = conn.cursor()
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
        cur = conn.cursor()
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
        cur = conn.cursor()
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

# if __name__ == '__main__':
    # # נסיון הכנסה של נתונים לטבלת workouts
    # test_data = {
    #     "video_id": "456",
    #     "title": "Test Title"
    # }
    # inserted_row = insert_workout(test_data)
    # print("Inserted row:", inserted_row)
    

    # infos = get_info("https://www.youtube.com/watch?v=KMkmA4i2FQc")
    # inserted_row = insert_workout(infos)
    # print("Inserted row:", inserted_row)