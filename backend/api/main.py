from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from routers import homekitchen
from routers import auth, testRoute, me

app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'], # this line allows NEXT JS. might have to change for prod
    allow_credentials=True, #this for auth
    allow_methods=['*'], #if u wanted to, you could restrict use to just POST and GET 
    allow_headers=['*'] #this can be useful for custom headers
)

@app.get('/')
def health_check():
    return 'Health check complete'

app.include_router(auth.router)
app.include_router(testRoute.router)
app.include_router(homekitchen.router)
app.include_router(me.router)

# all restaurants 
# dishes from restaurants 
# get orders - for drivers 