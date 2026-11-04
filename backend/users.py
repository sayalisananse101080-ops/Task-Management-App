import json
import httpx
import secrets
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from database import get_connection
from pwdlib import PasswordHash
password_hash = PasswordHash.recommended()
router = APIRouter()


class GeoData(BaseModel):
    lat: str
    lng: str
    
class AddressData(BaseModel):
    street:str
    suite:str
    city:str
    zipcode:str
    geo: GeoData
    
class CompanyData(BaseModel):
    name:str
    catchPhrase: str
    bs:str
    
class UserCreate(BaseModel):
    name:str = Field(min_length=1, max_length=150)
    username: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    address: AddressData
    phone: str | None = None
    website: str | None = None
    company: CompanyData
    
class UserUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    username: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str | None = Field(default=None, min_length=8, max_length=128)
    address: AddressData
    phone: str | None = None
    website: str | None = None
    company: CompanyData
    
class UserPatch(BaseModel):
    name: str | None = Field(default= None, min_length=1, max_length=150)
    username: str | None = Field(default= None, min_length=1, max_length=150)
    email: EmailStr | None = None
    password: str | None = Field(default= None, min_length=8, max_length=128)
    
    street: str | None= None
    suite: str | None = None
    city: str | None = None
    zipcode: str | None = None
    lat: str | None = None
    lng: str | None = None
    
    phone: str | None= None
    website: str | None= None
    
    company_name: str | None = None
    company_catch_phrase: str | None= None
    company_bs: str | None = None
    
def format_user(user):
    if user is None:
        return None
    
    return{
        "id":user["id"],
        "name": user["name"],
        "username": user["username"],
        "email": user["email"],
        "address":{
            "street": user["street"],
            "suite": user["suite"],
            "city": user["city"],
            "zipcode": user["zipcode"],
            "geo":{
                "lat": user["lat"],
                "lng": user["lng"]
            }
        },
        "phone": user["phone"],
        "website": user["website"],
        "company":{
            "name": user["company_name"],
            "catchPhrase": user["company_catch_phrase"],
            "bs": user["company_bs"]
        }
        # "created_at": user["created_at"]
    }
# IMPORT USERS FROM JSONPLACEHOLDER
def import_users():
    file_path = Path(__file__).with_name("users.json")
    with open(file_path, "r", encoding="utf-8") as file:
        users=json.load(file)
    print("Totla users found:", len(users))
    
    connection = get_connection()
    cursor = connection.cursor()

    try:
        for user in users:
            address = user["address"]
            geo = address["geo"]
            company = user["company"]
            temporary_password = secrets.token_urlsafe(16)
            hashed_password = password_hash.hash(temporary_password)
            cursor.execute(
                """
                INSERT INTO users
                    (name, username, email, password, street,
                    suite, city, zipcode, lat, lng,
                    phone, website, company_name,
                    company_catch_phrase, company_bs)
                VALUES (%s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    street= VALUES(street),
                    suite= VALUES(suite),
                    city= VALUES(city),
                    zipcode = VALUES(zipcode),
                    lat= VALUES(lat),
                    lng= VALUES(lng),
                    phone = VALUES(phone),
                    website = VALUES(website),
                    company_name = VALUES(company_name),
                    company_catch_phrase = VALUES(company_catch_phrase),
                    company_bs = VALUES(company_bs)
                """,
                (
                    user["name"],
                    user["username"],
                    user["email"],
                    hashed_password,
                    address["street"],
                    address["suite"],
                    address["city"],
                    address["zipcode"],
                    geo["lat"],
                    geo["lng"],
                    user.get("phone"),
                    user.get("website"),
                    company["name"],
                    company["catchPhrase"],
                    company["bs"]
                ),
            )
            
        connection.commit()
        print(f"Imported {len(users)} users successfully.")

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()

# SELECT ALL USERS
@router.get("/users")
def get_users():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, name, username, email, street,
                    suite, city, zipcode, lat, lng, 
                    phone, website, company_name, 
                    company_catch_phrase, company_bs                    
            FROM users
            ORDER BY id
            """
        )
        users = cursor.fetchall()
        # print("Users fetched from database:", len(users))
        return [format_user(user) for user in users]
    
    finally:
        cursor.close()
        connection.close()


# SELECT USER BY ID
@router.get("/users/{user_id}")
def get_user(user_id: int):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM users WHERE id = %s",
            (user_id,)
        )
        user = cursor.fetchone()

        if user is None:
            raise HTTPException(404, "User not found")

        return format_user(user)

    finally:
        cursor.close()
        connection.close()


# CREATE USER
@router.post("/users", status_code=201)
def create_user(user: UserCreate):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    

    try:
        hashed_password = password_hash.hash(user.password)
        cursor.execute(
            """
            INSERT INTO users
                (name, username, email, password, street,
                suite, city, zipcode, lat, lng, phone,
                website, company_name, company_catch_phrase,
                company_bs)
            VALUES (%s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user.name.strip(),
                user.username.strip(),
                str(user.email),
                hashed_password,
                user.address.street,
                user.address.suite,
                user.address.city,
                user.address.zipcode,
                user.address.geo.lat,
                user.address.geo.lng,
                user.phone,
                user.website,
                user.company.name,
                user.company.catchPhrase,
                user.company.bs
            ),
        )
        
        new_id = cursor.lastrowid
        connection.commit()
        
        return{
            "id": new_id,
            "name": user.name,
            "username": user.username,
            "email": str(user.email),
            "message": "User created sucessfully"
        }
        # cursor.execute(
        #     "SELECT * FROM users WHERE id = %s",
        #     (new_id,)
        # )
        # return format_user(cursor.fetchone())

    except Exception as exc:
        connection.rollback()

        if getattr(exc, "errno", None) == 1062:
            raise HTTPException(
                status_code=409, detail="Username or email already exists"
            )
        raise HTTPException(
            status_code=500,
            detail="Username or email already exists."
        )

    finally:
        cursor.close()
        connection.close()



# UPDATE USER
@router.put("/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        hashed_password = (
            password_hash.hash(user.password)
            if user.password
            else None
        )
        
        cursor.execute(
            """
            UPDATE users
            SET name=%s, username=%s, email=%s, password = COALESCE(%s, password),
                street=%s, suite=%s, city= %s, zipcode=%s,
                lat= %s, lng=%s, phone=%s, website=%s,
                company_name=%s, company_catch_phrase = %s, company_bs = %s
            WHERE id=%s
            """,
            (
                user.name.strip(),
                user.username.strip(),
                str(user.email),
                hashed_password,
                user.address.street,
                user.address.suite,
                user.address.city,
                user.address.zipcode,
                user.address.geo.lat,
                user.address.geo.lng,
                user.phone,
                user.website,
                user.company.name,
                user.company.catchPhrase,
                user.company.bs,
                user_id,
            ),
        )
        if cursor.rowcount== 0:
            cursor.execute(
                "SELECT * FROM users WHERE id = %s",
                (user_id,)
            )
            updated_user = cursor.fetchone()
            if updated_user is None:
                raise HTTPException(status_code=404,detail= "User not found")
            
        connection.commit()
        return format_user(updated_user)

    except HTTPException:
        connection.rollback()
        raise

    except Exception as exc:
        connection.rollback()

        if getattr(exc, "errno", None) == 1062:
            raise HTTPException(
                409, "Username or email already exists"
            )
        raise

    finally:
        cursor.close()
        connection.close()

@router.patch("/users/{user_id}")
def patch_user(user_id: int, user: UserPatch):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        update_data= user.model_dump(exclude_unset= True)
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail = "No fields provided for update"
            )
            
        #hash password before storing
        if "password" in update_data:
            if update_data["password"] is None:
                raise HTTPException(
                    status_code= 400,
                    detail= "Password cannot be null"
                )
                
            update_data["password"] = password_hash.hash(
                update_data["password"]
            )
            allowed_columns={
                "name","username","email","password",
                "street","suite","city","zipcode","lat",
                "lng","phone","website", "company_name",
                "company_catch_phrase","company_bs"
            }
            
            fields=[
                key for key in update_data
                if key in allowed_columns
            ]
            set_clause = ", ".join(
                f"{field} = %s" for field in fields
            )
            values = [update_data[field] for field in fields]
            values.append(user_id)
            cursor.execute(
                f"UPDATE users SET {set_clause} WHERE id = %s",
                tuple(values)
            )
            cursor.execute(
                "SELECT * FROM users WHERE id = %s",
                (user_id,)
            )
            
            updated_user = cursor.fetchone()
            
            if updated_user is None:
                raise HTTPException(
                    status_code=404,
                    detail= "User not found"
                )
            
            connection.commit()
            
            return format_user(updated_user)
    except HTTPException:
        connection.rollback()
        raise
    except Exception as exc:
        connection.rollback()
        
        if getattr(exc, "errno", None) == 1062:
            raise HTTPException(
                status_code = 409,
                detail= "Username or email already exists"
            )
            raise
    finally:
        cursor.close()
        connection.close()
        
        allowed_columns={
            "name", "username", ""
        }

# DELETE USER
@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            "DELETE FROM users WHERE id = %s",
            (user_id,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(404, "User not found")

        connection.commit()
        return {"message": "User deleted successfully"}

    except HTTPException:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    import_users()
