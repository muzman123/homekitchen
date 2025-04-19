from fastapi import APIRouter, HTTPException, status
from deps import user_dependancy
from db import execute_query
from utils.userRole import get_user_role

router = APIRouter(
    prefix='/me',
    tags=['me']
)

@router.get("/", status_code=status.HTTP_200_OK)
def get_me(user: user_dependancy):
    # Get base user info
    user_info_query = """
        SELECT UID, FirstName, LastName, PhoneNo
        FROM USERS
        WHERE Email = %s
    """
    user_result = execute_query(user_info_query, (user['email'],), fetch=True)

    if not user_result:
        raise HTTPException(status_code=404, detail="User not found")

    uid, first_name, last_name, phone_no = user_result[0]
    role = get_user_role(uid)

    response = {
        "UID": uid,
        "FirstName": first_name,
        "LastName": last_name,
        "PhoneNo": phone_no,
        "Role": role
    }

    # Add role-specific info
    if role == "customer":
        addresses_query = "SELECT Address FROM CUSTOMERADDRESSES WHERE CustomerUID = %s"
        addresses = execute_query(addresses_query, (uid,), fetch=True)
        response["Addresses"] = [row[0] for row in addresses]

    elif role == "owner":
        kitchen_query = "SELECT * FROM HOMEKITCHENS WHERE OwnerUID = %s"
        kitchens = execute_query(kitchen_query, (uid,), fetch=True)
        response["HomeKitchens"] = kitchens

    return response
