import os
from dotenv import load_dotenv
import pymysql
from fastapi import HTTPException


load_env = load_dotenv()


def get_connection():
    return pymysql.connect(
        host=os.getenv('db_host'),
        user=os.getenv('db_user'),
        password=os.getenv('db_password'),
        db=os.getenv('db_name')
    )


def execute_query(query, params=None, fetch=False):
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch:
                result = cursor.fetchall()
            else:
                conn.commit()
                result = None
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
db_con = get_connection()
print(type(db_con))
db_con.close()