from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash
from database import get_connection
from users import AddressData, CompanyData
import traceback
import os
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
load_dotenv()
router = APIRouter(prefix="/auth", tags=["Authentication"])
security= HTTPBearer(auto_error = False)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIPRE_MIUNTES", "30")
)
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")

password_hash = PasswordHash.recommended()


# PASSWORD VALIDATION
def validate_password(password: str):
    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters")

    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain an uppercase letter")

    if not any(c.islower() for c in password):
        raise ValueError("Password must contain a lowercase letter")

    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain a number")

    if not any(not c.isalnum() for c in password):
        raise ValueError("Password must contain a special character")


# SIGNUP REQUEST
class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    username: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    address: AddressData
    phone: str | None = None
    website: str | None = None
    company: CompanyData

# LOGIN REQUEST
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# SIGNUP API
@router.post("/signup", status_code=201)
def signup(user: SignupRequest):

    try:
        validate_password(user.password)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Check duplicate email or username
        cursor.execute(
            """
            SELECT id FROM users
            WHERE email = %s OR username = %s
            """,
            (str(user.email), user.username)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email or username already exists"
            )

        hashed_password = password_hash.hash(user.password)

        address = user.address
        geo = address.geo
        company = user.company

        cursor.execute(
            """
            INSERT INTO users (
                name, username, email, password,
                is_registered, street, suite, city,
                zipcode, lat, lng, phone, website,
                company_name, company_catch_phrase, company_bs
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s
            )
            """,
            (
                user.name,
                user.username,
                str(user.email),
                hashed_password,
                1,
                address.street,
                address.suite,
                address.city,
                address.zipcode,
                geo.lat,
                geo.lng,
                user.phone,
                user.website,
                company.name,
                company.catchPhrase,
                company.bs
            )
        )

        new_id = cursor.lastrowid
        connection.commit()

        return {
            "message": "Account created successfully",
            "user_id": new_id,
            "email": str(user.email)
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception as exc:
        connection.rollback()
        print("SIGNUP ERROR:", repr(exc))
        traceback.print_exc()
        
        raise HTTPException(
            status_code=500,
            detail="Signup failed. Please try again."
        )

    finally:
        cursor.close()
        connection.close()


def create_access_token(data: dict):
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    
    to_encode.update({
        "exp": expire
    })
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Pleaase Login first"
        )
    token= credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )
        return int(user_id)
        
    except(jwt.InvalidTokenError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
# LOGIN API
@router.post("/login")
def login(user: LoginRequest):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, name, email, password, is_registered
            FROM users
            WHERE email = %s
            """,
            (str(user.email),)
        )

        db_user = cursor.fetchone()

        if not db_user or not db_user["is_registered"]:
            raise HTTPException(
                status_code=404,
                detail="Please sign up first, then login."
            )

        if not password_hash.verify(
            user.password,
            db_user["password"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        access_token = create_access_token(
            data={
                "sub":str(db_user["id"]),
                "email":db_user["email"]
            }
        )

        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_user["id"],
            "name": db_user["name"],
            "email": db_user["email"]
        }

    finally:
        cursor.close()
        connection.close()

@router.get("/me")
def get_my_profile(
    user_id:int = Depends(get_current_user)
):
    connection=get_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute(
            """
            SELECT id, name, username, email,
            street, suite, city, zipcode, lat, lng,
            phone, website, company_name,
            company_catch_phrase, company_bs
            FROM users
            WHERE id= %s AND is_registered = 1
            """,
            (user_id,)
        )
        
        user= cursor.fetchone()
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="Registered user not found"
            )
            
        return{
            "message": "Authentication successfully",
            "user": user
        }
    finally:
        cursor.close()
        connection.close()