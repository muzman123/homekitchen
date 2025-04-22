from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from routers import homekitchen
from routers import auth, testRoute, me, driver, order, admin
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
app.include_router(driver.router)
app.include_router(order.router)
app.include_router(admin.router)

# all restaurants 
# dishes from restaurants 
# get orders - for drivers 