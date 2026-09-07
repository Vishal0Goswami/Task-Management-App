from fastapi import FastAPI 
from src.utils.db import Base, engine 
from src.tasks.model import TaskModel
from src.tasks.router import task_routes 
from src.users.router import user_routes
from src.tasks.dtos import TaskSchema
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(engine)

app = FastAPI(title="This is my Task Management System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_routes)
app.include_router(user_routes)