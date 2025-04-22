from fastapi import APIRouter, HTTPException, status, Depends
from db import execute_query
from deps import user_dependancy
from utils.userRole import get_user_role

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

def verify_admin(user):
    role = user['role']
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return True

# ✅ Approve a driver
@router.put("/verify-driver/{driver_id}")
def verify_driver(driver_id: int, user: user_dependancy):
    verify_admin(user)
    execute_query(
        "UPDATE DRIVERS SET ApprovalStatus = 'approved', VerifiedBy = %s WHERE DriverUID = %s",
        (user['uid'], driver_id)
    )
    return {"message": f"Driver {driver_id} approved"}

# ✅ Delete a user and associated records
@router.delete("/delete-user/{uid}")
def delete_user(uid: int, user: user_dependancy):
    verify_admin(user)
    # Optional: delete from role tables first
    execute_query("DELETE FROM CUSTOMERS WHERE CustomerUID = %s", (uid,))
    execute_query("DELETE FROM DRIVERS WHERE DriverUID = %s", (uid,))
    execute_query("DELETE FROM KITCHENOWNERS WHERE OwnerUID = %s", (uid,))
    execute_query("DELETE FROM USERS WHERE UID = %s", (uid,))
    return {"message": f"User {uid} deleted"}

# ✅ Approve a restaurant
@router.put("/approve-kitchen/{kitchen_id}")
def approve_kitchen(kitchen_id: int, user: user_dependancy):
    verify_admin(user)
    execute_query(
        "UPDATE HOMEKITCHENS SET ApprovalStatus = 'approved', VerifiedBy = %s WHERE KitchenID = %s",
        (user["uid"], kitchen_id)
    )
    return {"message": f"Kitchen {kitchen_id} approved"}

@router.get("/pending-drivers")
def get_pending_drivers(user: user_dependancy):
    verify_admin(user)
    query = "SELECT DriverUID FROM DRIVERS WHERE ApprovalStatus != 'approved' OR ApprovalStatus IS NULL"
    result = execute_query(query, fetch=True)
    return [dict(DriverUID=row[0]) for row in result]

@router.get("/pending-kitchens")
def get_pending_kitchens(user: user_dependancy):
    verify_admin(user)
    query = "SELECT KitchenID, Name FROM HOMEKITCHENS WHERE ApprovalStatus != 'approved' OR ApprovalStatus IS NULL"
    result = execute_query(query, fetch=True)
    return [dict(KitchenID=row[0], Name=row[1]) for row in result]

@router.get("/all-users")
def get_all_users(user: user_dependancy):
    verify_admin(user)
    query = "SELECT UID, FirstName, LastName FROM USERS"
    users = execute_query(query, fetch=True)

    # Attach role for each user
    output = []
    for uid, first, last in users:
        role = get_user_role(uid)
        output.append({
            "UID": uid,
            "FirstName": first,
            "LastName": last,
            "Role": role
        })

    return output
