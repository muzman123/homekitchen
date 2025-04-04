from fastapi import APIRouter, Depends, HTTPException, status
from deps import user_dependancy


router = APIRouter(
    prefix='/test',
    tags=['test']
)

@router.get('/test', status_code=status.HTTP_200_OK)
def return_test_health(user: user_dependancy):
    return {'message' : 'Works'}