from fastapi import APIRouter, HTTPException, status
from deps import user_dependancy
from db import execute_query

router = APIRouter(prefix="/driver", tags=["driver"])

# ------------------- Get Pending Orders -------------------
@router.get("/orders/pending", status_code=status.HTTP_200_OK)
def get_pending_orders(user: user_dependancy):
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can view this route")

    query = "SELECT * FROM ORDERS WHERE Status = 'Pending'"
    orders = execute_query(query, fetch=True)
    return orders

# ------------------- Claim an Order -------------------
@router.post("/orders/{order_id}/claim", status_code=status.HTTP_200_OK)
def claim_order(order_id: int, user: user_dependancy):
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can claim orders")

    # Check order status
    check_query = "SELECT Status FROM ORDERS WHERE OrderID = %s"
    result = execute_query(check_query, (order_id,), fetch=True)

    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    if result[0][0] != 'Pending':
        raise HTTPException(status_code=400, detail="Order has already been claimed or completed")

    # Update to claimed
    update_query = "UPDATE ORDERS SET Status = 'Claimed', DriverUID = (SELECT UID FROM USERS WHERE Email = %s) WHERE OrderID = %s"
    execute_query(update_query, (user['email'], order_id))
    return {"message": "Order claimed successfully"}

# ------------------- Complete an Order -------------------
@router.post("/orders/{order_id}/complete", status_code=status.HTTP_200_OK)
def complete_order(order_id: int, user: user_dependancy):
    if user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers can complete orders")

    # Check order and ownership
    check_query = """
        SELECT Status, DriverUID FROM ORDERS 
        WHERE OrderID = %s AND DriverUID = (SELECT UID FROM USERS WHERE Email = %s)
    """
    result = execute_query(check_query, (order_id, user['email']), fetch=True)

    if not result:
        raise HTTPException(status_code=403, detail="Order is not assigned to you or doesn't exist")

    status_now, _ = result[0]
    if status_now != 'Claimed':
        raise HTTPException(status_code=400, detail="Order must be claimed before completing")

    # Update to completed
    update_query = "UPDATE ORDERS SET Status = 'Completed' WHERE OrderID = %s"
    execute_query(update_query, (order_id,))
    return {"message": "Order marked as completed"}
