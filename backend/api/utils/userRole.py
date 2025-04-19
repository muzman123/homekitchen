from db import execute_query

# get the users role: 
def get_user_role(userID: int):
    if execute_query("SELECT * FROM KITCHENOWNERS WHERE OwnerUID = %s", (userID,), fetch=True):
        return "owner"
    if execute_query("SELECT * FROM DRIVERS WHERE DriverUID = %s", (userID,), fetch=True):
        return "driver"
    if execute_query("SELECT * FROM CUSTOMERS WHERE CustomerUID = %s", (userID,), fetch=True):
        return "customer"