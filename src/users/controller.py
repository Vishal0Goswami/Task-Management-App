from fastapi import HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session 
from src.users.dtos import UserSchema, LoginSchema
from src.users.model import UserModel
from src.utils.settings import settings
from src.utils.mail import send_email
from datetime import datetime, timedelta

from pwdlib import PasswordHash
import jwt  # use for generate token 
from jwt.exceptions import InvalidTokenError

password_hash = PasswordHash.recommended()

def get_hash_password(password):
    return password_hash.hash(password)

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)



async def register(body:UserSchema, db:Session, bg_task:BackgroundTasks):
    ## 1. Username validation
    is_user = db.query(UserModel).filter(UserModel.username == body.username).first()
    if is_user:
        raise HTTPException(400, detail="Username already exists...")
    
    ## 2. Email validation
    is_user = db.query(UserModel).filter(UserModel.email == body.email).first()
    if is_user:
        raise HTTPException(400, detail="Email Address already exists...")

    hash_password = get_hash_password(body.password)

    new_user = UserModel(
        name = body.name, 
        username = body.username,
        hash_password = hash_password,
        email = body.email
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    ## send mail confirmation
    bg_task.add_task(send_email, [new_user.email])

    return new_user



def login_user(body:LoginSchema, db:Session):
    user = db.query(UserModel).filter(UserModel.username == body.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You entered wrong username")

    if not verify_password(body.password, user.hash_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You entered wrong password")

    exp_time = datetime.now() + timedelta(minutes=settings.EXP_TIME)

    token = jwt.encode({"_id":user.id, "exp":exp_time.timestamp()}, settings.SECRET_KEY, settings.ALGORITHM)

    return {"token":token}



## TOKEN SEND -
def is_authenticated(request:Request, db:Session):
    try:
        token = request.headers.get("authorization")
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You are unauthorized.")
        token = token.split(" ")[-1]

        data = jwt.decode(token, settings.SECRET_KEY, settings.ALGORITHM)
        user_id = data.get("_id")

        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You are unauthorized.")

        return user
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You are unauthorized.")
