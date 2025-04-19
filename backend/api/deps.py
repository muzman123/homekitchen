from typing import Annotated
from fastapi import Depends, HTTPException, status
# decodes jwt tokens from auth headers: 
from fastapi.security import OAuth2PasswordBearer

#Used to hash pws and veryify them
from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from db import get_connection
from pymysql.connections import Connection


load_dotenv()

SECRET_KEY =    os.getenv('AUTH_SECRET_KEY')
ALGORITHM = os.getenv('AUTH_ALGORITHM')

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto' )

#Tell fastapi if someone hits a protected route you should have a token and assume its from auth/token
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')
oauth2_bearer_dependancy = Annotated[str, Depends(oauth2_bearer)]

# I technically do not need a db dependency since I will use execute_query() which 
# handles that part so lets keep it like that
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
db_dependancy = Annotated[Connection, Depends(get_db)]

# depends on oauth2_bearer_dependency first. Sees if we have a token or not
# this checks everytime if we have a loggen in user or not. 
async def get_current_user(token: oauth2_bearer_dependancy):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get('sub')
        role: str = payload.get('role')
        # user_id: int = payload.get('id')

        if email is None or role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user - 0')
        return {'email': email, 'role': role}
    
    except JWTError:
        raise  HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user - 1')
    
#this specific line checks if we have a logged in user or not
# Annotated tells pythin that userdependency should be a dictionary 
# what depends(get_current_user) does is run get_current_user everytime. 
# when get current user is run we either get a token that authenticates the user or otherwise it returns unauth error
user_dependancy = Annotated[dict, Depends(get_current_user)]

def only_owner(token: oauth2_bearer_dependancy):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get('role')

        if role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user role')
        
        if role is not 'owner':
            return False
        
        return True
    
    except JWTError:
        raise  HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate user role')
    
owner_dependancy = Annotated[dict, Depends(only_owner)]