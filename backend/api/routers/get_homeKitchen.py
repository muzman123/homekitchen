from fastapi import APIRouter, HTTPException, status
from deps import user_dependancy, owner_dependancy
from db import execute_query
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix='/homekitchens',
    tags=['homekitchens']
)

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
