import os
import httpx
import mysql.connector
from fastapi import FastAPI, HTTPException, APIRouter
# from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from database import get_connection
from auth import get_current_user
from fastapi import Depends
 
JSONPLACEHOLDER_URL = "https://jsonplaceholder.typicode.com"
router = APIRouter()
# def get_connection():
#     return mysql.connector.connect(
#         host="localhost",
#         user="root",
#         password=os.getenv("MYSQL_PASSWORD","Sayali@123"),
#         database="task_management_db",
#     )
 
async def sync_jsonplaceholder_to_mysql():
    """Fetch all JSONPlaceholder todos and sync them into MySQL."""
 
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
            f"{JSONPLACEHOLDER_URL}/todos"
            )
            response.raise_for_status()
            todos = response.json()
 
    except httpx.HTTPError as exc:
        print(f"JSONPlaceholder sync failed: {exc}")
        return
    
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM tasks")
        if cursor.fetchone()[0] > 0:
            print("Tasks already exist. Skippling import.")
            return
        
        for item in todos:
            status = "Completed" if item["completed"] else "Pending"
 
            cursor.execute(
                """
                INSERT INTO tasks
                    (userId, title,
                     description, status, priority)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    # item["id"],
                    item["userId"],
                    item["title"],
                    "",
                    status,
                    "Medium",
                ),
            )
 
        conn.commit()
        print(f"Imported {len(todos)} tasks into MySQL")
 
    except mysql.connector.Error as exc:
        if conn:
            conn.rollback()
        print(f"MySQL sync failed: {exc}")
    except Exception:
        conn.rollback()
        raise
 
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
        
# @asynccontextmanager
# async def lifespan(app: FASTAPI):
#     await sync_jsonplaceholder_to_mysql()
#     yield
    
# app = FastAPI(title="Task Management API", lifespan=lifespan)
 
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[""],
#     allow_credentials= False,
#     allow_methods=[""],
#     allow_headers=["*"],
# )
 
class TaskData(BaseModel):
    # userId body madhun GHET NAHI - to nehmi login token madhun yeto
    title: str = Field(min_length=1)
    description: str = ""
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"
    priority: Literal["Low", "Medium", "High"] = "Medium"
 
 
@router.get("/")
def home():
    return {"message": "FastAPI connected to MYSQL"}
 
 
# GET: fakt login zalelya user che tasks
@router.get("/tasks")
def get_tasks(user_id: int = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM tasks WHERE userId = %s ORDER BY id DESC",
            (user_id,),
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
 
 
# GET by id: task dusrya user cha asel tar 404
@router.get("/tasks/{task_id}")
def get_task(task_id: int, user_id: int = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM tasks WHERE id = %s AND userId = %s",
            (task_id, user_id),
        )
        task = cursor.fetchone()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    finally:
        cursor.close()
        conn.close()
 
 
# CREATE: userId token madhun automatic set hoto
@router.post("/tasks", status_code=201)
def create_task(task: TaskData, user_id: int = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO tasks
            (userId, title, description, status, priority)
            VALUES (%s, %s, %s, %s, %s)""",
            (
                user_id,
                task.title.strip(),
                task.description,
                task.status,
                task.priority,
            ),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM tasks WHERE id = %s", (new_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
 
 
# UPDATE: fakt swatacha task
@router.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    task: TaskData,
    user_id: int = Depends(get_current_user),
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """UPDATE tasks SET title=%s, description=%s,
            status=%s, priority=%s
            WHERE id=%s AND userId=%s""",
            (
                task.title.strip(),
                task.description,
                task.status,
                task.priority,
                task_id,
                user_id,
            ),
        )
        cursor.execute(
            "SELECT * FROM tasks WHERE id = %s AND userId = %s",
            (task_id, user_id),
        )
        updated_task = cursor.fetchone()
 
        if updated_task is None:
            raise HTTPException(status_code=404, detail="Task not found")
 
        conn.commit()
        return updated_task
    except HTTPException:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
 
 
# DELETE: fakt swatacha task
@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, user_id: int = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM tasks WHERE id = %s AND userId = %s",
            (task_id, user_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        conn.commit()
        return {"message": "Task deleted successfully"}
    finally:
        cursor.close()
        conn.close()
 