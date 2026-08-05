from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from db import get_db, utc_now
from models import UserPublic, UpdateProfileRequest, ChangePasswordRequest
from auth_utils import get_current_user, verify_password, hash_password, require_roles

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserPublic])
async def list_users(_: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    docs = await db.users.find({}, {"password_hash": 0}).to_list(500)
    return [
        UserPublic(
            id=str(d["_id"]), email=d["email"], name=d["name"], role=d["role"],
            photo=d.get("photo"), online=d.get("online", False), phone=d.get("phone"),
            designation=d.get("designation"), department=d.get("department"),
        )
        for d in docs
    ]


@router.patch("/me", response_model=UserPublic)
async def update_me(payload: UpdateProfileRequest, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        return current
    updates["updated_at"] = utc_now().isoformat()
    await db.users.update_one({"_id": ObjectId(current.id)}, {"$set": updates})
    doc = await db.users.find_one({"_id": ObjectId(current.id)})
    return UserPublic(
        id=str(doc["_id"]), email=doc["email"], name=doc["name"], role=doc["role"],
        photo=doc.get("photo"), online=doc.get("online", False), phone=doc.get("phone"),
        designation=doc.get("designation"), department=doc.get("department"),
    )


@router.post("/me/password")
async def change_password(payload: ChangePasswordRequest, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(current.id)})
    if not verify_password(payload.current_password, doc.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    await db.users.update_one(
        {"_id": ObjectId(current.id)},
        {"$set": {"password_hash": hash_password(payload.new_password), "updated_at": utc_now().isoformat()}}
    )
    await db.activity_logs.insert_one({
        "user_id": current.id, "user_name": current.name, "user_role": current.role,
        "action": "Changed password", "module": "Settings", "target": "Security",
        "created_at": utc_now().isoformat(),
    })
    return {"ok": True}
