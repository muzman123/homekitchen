from fastapi import APIRouter, HTTPException, status
from deps import user_dependancy, owner_dependancy
from db import execute_query
from pydantic import BaseModel
from typing import Optional, List
from utils.userRole import get_user_role
from utils.verify_owner import verify_owner

router = APIRouter(
    prefix='/homekitchens',
    tags=['homekitchens']
)

# ------------------- Models -------------------
class MealPlanItem(BaseModel):
    ItemID: int

class MealPlanCreate(BaseModel):
    Name: str
    TotalPrice: float
    Image: str
    Items: List[MealPlanItem]

class MenuItemCreate(BaseModel):
    Name: str
    Description: str
    Price: float
    Image: str
    Items: List[MealPlanItem]

class HomeKitchenCreate(BaseModel):
    Name: str
    Address: str
    AverageRating: Optional[float] = None
    VerifiedBy: Optional[int] = None
    ApprovalStatus: str = None
    Logo: Optional[str] = None



@router.get('/', status_code=status.HTTP_200_OK)
def return_homeKitchens(user: user_dependancy):
    query='SELECT * FROM HOMEKITCHENS'
    homekitchens = execute_query(query=query,fetch=True)
    return homekitchens


@router.post('/', status_code=status.HTTP_201_CREATED)
def make_homekitchen( create_kitchen_request: HomeKitchenCreate ,user: user_dependancy, owner: owner_dependancy):
    # Get OwnerUID (assuming it's the UserID from USERS table)
    owner_uid_query = "SELECT UID FROM USERS WHERE Email = %s"
    owner_uid_result = execute_query(owner_uid_query, (user['email'],), fetch=True)

    if not owner_uid_result:
        raise HTTPException(status_code=400, detail="Owner not found")

    owner_uid = owner_uid_result[0][0]
    if get_user_role(owner_uid) != 'owner':
        raise HTTPException(status_code=401, detail="Not an owner")

        # Insert into HOMEKITCHENS table
    insert_query = """
        INSERT INTO HOMEKITCHENS (
            OwnerUID, Name, Address, AverageRating, VerifiedBy, ApprovalStatus, Logo
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    execute_query(insert_query, (
        owner_uid,
        create_kitchen_request.Name,
        create_kitchen_request.Address,
        create_kitchen_request.AverageRating,
        create_kitchen_request.VerifiedBy,
        create_kitchen_request.ApprovalStatus,
        create_kitchen_request.Logo
    ))

    return {"message": "HomeKitchen created successfully"}

@router.get('/{kitchen_id}/mealplans', status_code=status.HTTP_200_OK)
def get_mealplans_for_kitchen(kitchen_id: int, user: user_dependancy):
    query = "SELECT * FROM MEALPLANS WHERE KitchenID = %s"
    mealplans = execute_query(query, (kitchen_id,), fetch=True)

    if not mealplans:
        raise HTTPException(status_code=404, detail="No meal plans found for this kitchen")

    return mealplans


@router.get('/{kitchen_id}/menuitems', status_code=status.HTTP_200_OK, summary="Get menu items")
def get_menu_items_for_kitchen(kitchen_id: int, user: user_dependancy):
    """Get menu items of a specific kitchen

    """
    query = "SELECT * FROM MENUITEMS WHERE KitchenID = %s"
    mealplans = execute_query(query, (kitchen_id,), fetch=True)

    if not mealplans:
        raise HTTPException(status_code=404, detail="No meal plans found for this kitchen")

    return mealplans

# ------------------- Get MealPlan Items -------------------
@router.get("/{kitchen_id}/{mealplan_id}/items", status_code=status.HTTP_200_OK)
def get_mealplan_items(kitchen_id: int,mealplan_id: int, user: user_dependancy):
    query = """
        SELECT MENUITEMS.* FROM MEALPLANITEMS
        JOIN MENUITEMS ON MEALPLANITEMS.ItemID = MENUITEMS.ItemID
        WHERE MEALPLANITEMS.MealPlanID = %s
    """
    items = execute_query(query, (mealplan_id,), fetch=True)
    if not items:
        raise HTTPException(status_code=404, detail="No items found for this meal plan")
    return items

# ------------------- Create Meal Plan -------------------
@router.post("/{kitchen_id}/mealplans", status_code=status.HTTP_201_CREATED)
def create_mealplan(kitchen_id: int, mealplan: MealPlanCreate, user: user_dependancy):
    verify_owner(user['email'], kitchen_id)

    # Validate all menu items exist and belong to this kitchen
    for item in mealplan.Items:
        validation_query = "SELECT * FROM MENUITEMS WHERE ItemID = %s AND KitchenID = %s"
        result = execute_query(validation_query, (item.ItemID, kitchen_id), fetch=True)
        if not result:
            raise HTTPException(status_code=400, detail=f"Menu item {item.ItemID} does not exist in this kitchen")


    insert_query = """
        INSERT INTO MEALPLANS (KitchenID, Name, TotalPrice, Image)
        VALUES (%s, %s, %s, %s)
    """
    execute_query(insert_query, (kitchen_id, mealplan.Name, mealplan.TotalPrice, mealplan.Image))

    # Get newly inserted MealPlanID
    get_mealplan_id = "SELECT MealPlanID FROM MEALPLANS WHERE KitchenID = %s AND Name = %s ORDER BY MealPlanID DESC LIMIT 1"
    mealplan_id = execute_query(get_mealplan_id, (kitchen_id, mealplan.Name), fetch=True)[0][0]

    # Insert each item into MEALPLANITEMS
    for item in mealplan.Items:
        execute_query("INSERT INTO MEALPLANITEMS (KitchenID, MealPlanID, ItemID) VALUES (%s, %s, %s)", (kitchen_id, mealplan_id, item.ItemID))

    return {"message": "Meal plan created successfully"}

# ------------------- Delete Meal Plan -------------------
@router.delete("/{kitchen_id}/mealplans/{mealplan_id}", status_code=status.HTTP_200_OK)
def delete_mealplan(kitchen_id: int, mealplan_id: int, user: user_dependancy):
    verify_owner(user['email'], kitchen_id)

    # Delete associated meal plan items first
    delete_items_query = "DELETE FROM MEALPLANITEMS WHERE MealPlanID = %s AND KitchenID = %s"
    execute_query(delete_items_query, (mealplan_id, kitchen_id))


    delete_plan_query = "DELETE FROM MEALPLANS WHERE MealPlanID = %s AND KitchenID = %s"
    execute_query(delete_plan_query, (mealplan_id, kitchen_id))

    return {"message": "Meal plan and its items deleted"}

# ------------------- Create Menu Item -------------------
@router.post("/{kitchen_id}/menuitems", status_code=status.HTTP_201_CREATED, summary="make menu items",  description="Allows a kitchen owner to create a new menu item for their kitchen.")
def create_menu_item(kitchen_id: int, item: MenuItemCreate, user: user_dependancy):
    verify_owner(user['email'], kitchen_id)
    query = """
        INSERT INTO MENUITEMS (KitchenID, Name, Description, Price, Image)
        VALUES (%s, %s, %s, %s, %s)
    """
    execute_query(query, (kitchen_id, item.Name, item.Description, item.Price, item.Image))
    return {"message": "Menu item created successfully"}

# ------------------- Delete Menu Item -------------------
@router.delete("/{kitchen_id}/menuitems/{item_id}", status_code=status.HTTP_200_OK)
def delete_menu_item(kitchen_id: int, item_id: int, user: user_dependancy):
    verify_owner(user['email'], kitchen_id)
    query = "DELETE FROM MENUITEMS WHERE ItemID = %s AND KitchenID = %s"
    execute_query(query, (item_id, kitchen_id))
    return {"message": "Menu item deleted"}

