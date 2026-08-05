from fastapi import APIRouter, Depends, Query
from db import get_db
from auth_utils import get_current_user
from models import UserPublic

router = APIRouter(prefix="/activity", tags=["activity"])


def _serialize(doc):
    return {
        "id": str(doc["_id"]),
        "user_id": doc.get("user_id"),
        "user_name": doc.get("user_name"),
        "user_role": doc.get("user_role"),
        "action": doc.get("action"),
        "module": doc.get("module"),
        "target": doc.get("target"),
        "created_at": doc.get("created_at"),
    }


@router.get("")
async def list_activity(
    limit: int = Query(50, ge=1, le=200),
    module: str | None = None,
    _: UserPublic = Depends(get_current_user),
):
    db = get_db()
    q = {}
    if module:
        q["module"] = module
    docs = await db.activity_logs.find(q).sort("created_at", -1).to_list(limit)
    return [_serialize(d) for d in docs]
