from fastapi import APIRouter, Depends, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from src.users import controller
from src.utils.db import get_db
from src.users.dtos import UserSchema, UserResponseSchema, LoginSchema
from src.utils.helpers import is_authenticated
from src.users.model import UserModel

user_routes = APIRouter(prefix="/users")


@user_routes.post("/create_user", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_user(body:UserSchema, bg_task:BackgroundTasks, db:Session = Depends(get_db)):
    return await controller.register(body, db, bg_task)


@user_routes.post("/login", status_code=status.HTTP_200_OK)
def login_user(body:LoginSchema, db:Session = Depends(get_db)):
    return controller.login_user(body, db)

@user_routes.put("/update_user", status_code=status.HTTP_200_OK)
def update_user(body:LoginSchema, db:Session = Depends(get_db), ):
    pass 

@user_routes.get("/is_auth", status_code=status.HTTP_200_OK)
def is_auth(request:Request, db:Session = Depends(get_db)):
    return controller.is_authenticated(request, db)