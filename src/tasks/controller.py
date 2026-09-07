from src.tasks.dtos import TaskSchema
from sqlalchemy.orm import Session 
from src.tasks.model import TaskModel
from src.users.model import UserModel
from fastapi import HTTPException

def create_task(body:TaskSchema, db:Session, user:UserModel):
    data = body.model_dump()
    print(data)
    new_task = TaskModel(
        title=data['title'], 
        description=data['description'], 
        is_completed=data['is_completed'],
        user_id = user.id
        )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


def get_tasks(db:Session, user:UserModel):
    tasks = db.query(TaskModel).filter(TaskModel.user_id == user.id).all()
    return tasks


def get_task(task_id:int, db:Session):
    one_task = db.query(TaskModel).filter(TaskModel.id==task_id).first()
    if one_task is None:
        return HTTPException(404, detail="Task_Id is incorrect")
    return one_task


def update_task(task_id:int, body:TaskSchema, db:Session, user:UserModel):
    one_task:TaskModel = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if one_task is None:
        return HTTPException(404, detail="Task_id is incorrect")
    if one_task.user_id != user.id:
        return HTTPException(404, detail="You are not allow to update this task")
    
    body = body.model_dump()
    for field, value in body.items():
        setattr(one_task, field, value)

    db.add(one_task)
    db.commit()
    db.refresh(one_task)
    return one_task



def delete_task(task_id:int, db :Session, user:UserModel):
    one_task:TaskModel = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if one_task is None:
        return HTTPException(404, detail="Task_id is incorrect")

    if one_task.user_id != user.id:
        return HTTPException(404, detail="You are not allow to delete this task")
    
    db.delete(one_task)
    db.commit()

    return None