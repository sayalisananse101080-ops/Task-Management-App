from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tasks import router as tasks_router, sync_jsonplaceholder_to_mysql
from users import router as users_router
from auth import router as auth_router
@asynccontextmanager
async def lifespan(app: FastAPI):
    await sync_jsonplaceholder_to_mysql()
    yield
    
app = FastAPI(
    title="Task Management API",
    version="0.1.0",
    lifespan= lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials= False,
    allow_methods= ["*"],
    allow_headers=["*"],
)

app.include_router(tasks_router, tags=["Tasks"])
app.include_router(users_router, tags=["Users"])
app.include_router(auth_router)
@app.get("/")
def home():
    return {"message": "Task Management API is running"}