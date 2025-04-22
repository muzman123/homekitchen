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

def show_schema_with_foreign_keys(database: str):
    """
    Retrieves each table’s column details and shows foreign key info if applicable.
    """
    query = """
    SELECT 
      c.TABLE_NAME, 
      c.COLUMN_NAME, 
      c.COLUMN_TYPE, 
      c.IS_NULLABLE, 
      c.COLUMN_KEY, 
      c.EXTRA,
      k.REFERENCED_TABLE_NAME, 
      k.REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS c
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
      ON c.TABLE_SCHEMA = k.TABLE_SCHEMA 
      AND c.TABLE_NAME = k.TABLE_NAME 
      AND c.COLUMN_NAME = k.COLUMN_NAME 
      AND k.REFERENCED_TABLE_NAME IS NOT NULL
    WHERE c.TABLE_SCHEMA = %s
    ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;
    """
    schema = execute_query(query, params=(database,), fetch=True)
    current_table = None
    for row in schema:
        table_name, column_name, column_type, is_nullable, column_key, extra, ref_table, ref_column = row
        if table_name != current_table:
            if current_table is not None:
                print()  # separate tables with an empty line
            current_table = table_name
            print(f"Table: {table_name}")
        fk_info = ""
        if ref_table:
            fk_info = f" [Foreign Key: references {ref_table}({ref_column})]"
        print(f"  {column_name}: {column_type}, Nullable: {is_nullable}, Key: {column_key}, Extra: {extra}{fk_info}")


    
db_con = get_connection()
print(type(db_con))
show_schema_with_foreign_keys(os.getenv('db_name'))
db_con.close()