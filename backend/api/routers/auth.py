from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt 
from dotenv import load_dotenv
import os
from deps import bcrypt_context
from db import execute_query


load_dotenv()


# instead of app we will use router
#somewhere in main we will write app.include_router(auth.router) which will make our requests come here
router = APIRouter(
    prefix='/auth',
    tags=['auth']
)

SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
ALGORITHM = os.getenv("AUTH_ALGORITHM")


# When we create a user , our create user request should follow this format
# I may have to modify this to work for our app as our user create probs has hella more shit
class UserCreateRequest(BaseModel):
    email:str
    password:str

class Token(BaseModel):
    access_token: str
    token_type: str

def authenticate_user(email: str, password: str):
    #this is our query to run
    query = "SELECT * FROM USERS WHERE email = %s"
    #once we execute hopefully we get a user
    user = execute_query(query, (email,), fetch=True)

    # no user then return false
    if not user or len(user) == 0:
        return False
    
    # user[3] refers to the 4th column in USERS where we have our email
    # user = user[3]
    hashed_password = user[0][5]  

    if not bcrypt_context.verify(password, hashed_password):
        return False

    # Return user info if authentication is successful
    return {
        'uid': user[0][0],
        'full_name': user[0][1] + user[0][2],
        'email': user[0][3],
        'phone_no': user[0][4]
    }

# This will create our jwt token for auth
def create_access_token(email:str , expires_delta:timedelta):
    encode = {'sub': email}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    #make a jwt token encoding for our email and exp using our secret key on the algorithm
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(create_user_request: UserCreateRequest):
    check_query = "SELECT * FROM USERS WHERE email= %s"
    existing_user = execute_query(check_query, (create_user_request.email,), fetch=True)

    if existing_user:
        raise HTTPException(status_code=400, detail='User already exists')

    # create user request here makes sure that password is as we want it
    hashed_pw = bcrypt_context.hash(create_user_request.password)

    insert_query = "INSERT INTO USERS (email, HashedPassword) VALUES (%s,%s)"
    execute_query(insert_query, (create_user_request.email, hashed_pw))

    return {'Message': "user creation success"}

# tells us our response will be of Type token we have defined
@router.post('/token', response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(form_data.username, form_data.password)
    print(user)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="could not validate user - 2")
    token = create_access_token( user['email'] , timedelta(minutes=20))

    # the token type bearer is what helps us to check if the jwt token is correct
    return {'access_token': token, 'token_type': 'bearer'}
