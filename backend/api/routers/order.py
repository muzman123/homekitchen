from fastapi import APIRouter, HTTPException, status 
from db import execute_query
from pydantic import BaseModel
from typing import List
from deps import user_dependancy

router = APIRouter(prefix='/order', tags=(['order']))

class OrderItem(BaseModel):
    ItemID: int

    Quantity: int


class OrderRequest(BaseModel):
    KitchenID: int
    Items: List[OrderItem]
    ETA: str  # expected format: HH:MM:SS
    TotalPrice: int

# ------------------- Place Order (Customer) -------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def place_order(order: OrderRequest, user: user_dependancy):
    if user['role'] != 'customer':
        raise HTTPException(status_code=403, detail="Only customers can place orders")

    # Get UID of current user
    customer_query = "SELECT UID FROM USERS WHERE Email = %s"
    customer_uid = execute_query(customer_query, (user['email'],), fetch=True)[0][0]

    total_price = order.TotalPrice

   # Insert into ORDERS
    insert_order = "INSERT INTO ORDERS (TotalPrice, ETA, CustomerUID, KitchenID, Status) VALUES (%s, %s, %s, %s, 'Pending')"
    kitchen_id = order.KitchenID
    execute_query(insert_order, (total_price, order.ETA, customer_uid, kitchen_id))

    # Get OrderID
    order_id_query = "SELECT OrderID FROM ORDERS WHERE CustomerUID = %s ORDER BY OrderID DESC LIMIT 1"
    order_id = execute_query(order_id_query, (customer_uid,), fetch=True)[0][0]

    # Insert items into ORDERCONTAINS
    for item in order.Items:
        execute_query("INSERT INTO ORDERCONTAINS (OrderID, KitchenID, ItemID) VALUES (%s, %s, %s)", (order_id, order.KitchenID, item.ItemID))

    return {"message": "Order placed successfully", "OrderID": order_id}

