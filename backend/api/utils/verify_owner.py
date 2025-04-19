from db import execute_query
from fastapi import HTTPException

# ------------------- Verify Owner Helper -------------------
def verify_owner(user_email: str, kitchen_id: int):
    query = """
        SELECT * FROM HOMEKITCHENS
        WHERE KitchenID = %s AND OwnerUID = (
            SELECT UID FROM USERS WHERE Email = %s
        )
    """
    result = execute_query(query, (kitchen_id, user_email), fetch=True)
    if not result:
        raise HTTPException(status_code=403, detail="You do not own this kitchen")
