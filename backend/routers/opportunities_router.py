from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from db import get_db
from auth_utils import get_current_user, require_roles
from models import UserPublic
from models_part2 import OpportunityIn, OpportunityAssign, OpportunityStatusPatch
from hub_utils import serialize, serialize_many, oid, utc_iso, log_activity, notify

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


async def _enrich(db, doc):
    if doc.get("assignee_id"):
        try:
            u = await db.users.find_one({"_id": ObjectId(doc["assignee_id"])}, {"name": 1, "photo": 1, "role": 1})
            if u:
                doc["assignee_name"] = u["name"]
                doc["assignee_photo"] = u.get("photo")
        except Exception:
            pass
    return doc


@router.get("")
async def list_opps(status: str | None = None, type: str | None = None,
                    assignee_id: str | None = None,
                    limit: int = Query(200, ge=1, le=500),
                    current: UserPublic = Depends(get_current_user)):
    db = get_db()
    q = {}
    if status: q["status"] = status
    if type: q["type"] = type
    if assignee_id: q["assignee_id"] = assignee_id
    docs = await db.opportunities.find(q).sort("deadline", 1).to_list(limit)
    for d in docs:
        await _enrich(db, d)
    return serialize_many(docs)


@router.post("", status_code=201)
async def create_opp(payload: OpportunityIn, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = utc_iso()
    doc["updated_at"] = utc_iso()
    doc["created_by"] = current.id
    res = await db.opportunities.insert_one(doc)
    doc["_id"] = res.inserted_id
    await _enrich(db, doc)
    await log_activity(db, current, "Logged opportunity", "Opportunity Hub", target=doc["title"])
    if doc.get("assignee_id") and doc["assignee_id"] != current.id:
        await notify(db, doc["assignee_id"], "Opportunity assigned",
                     f"{current.name} assigned you: {doc['title']}", kind="info", link="/opportunity-hub")
    return serialize(doc)


@router.get("/{opp_id}")
async def get_opp(opp_id: str, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    doc = await db.opportunities.find_one({"_id": oid(opp_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    await _enrich(db, doc)
    return serialize(doc)


@router.patch("/{opp_id}")
async def update_opp(opp_id: str, payload: dict, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    payload.pop("id", None); payload.pop("_id", None); payload.pop("created_at", None)
    payload["updated_at"] = utc_iso()
    res = await db.opportunities.update_one({"_id": oid(opp_id)}, {"$set": payload})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    doc = await db.opportunities.find_one({"_id": oid(opp_id)})
    await _enrich(db, doc)
    await log_activity(db, current, "Updated opportunity", "Opportunity Hub", target=doc["title"])
    return serialize(doc)


@router.post("/{opp_id}/assign")
async def assign_opp(opp_id: str, payload: OpportunityAssign, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    await db.opportunities.update_one({"_id": oid(opp_id)}, {"$set": {"assignee_id": payload.assignee_id, "status": "assigned", "updated_at": utc_iso()}})
    doc = await db.opportunities.find_one({"_id": oid(opp_id)})
    await _enrich(db, doc)
    await log_activity(db, current, "Assigned opportunity", "Opportunity Hub",
                       target=f"{doc['title']} → {doc.get('assignee_name')}")
    if payload.assignee_id != current.id:
        await notify(db, payload.assignee_id, "Opportunity assigned",
                     f"{current.name} assigned you: {doc['title']}", kind="info", link="/opportunity-hub")
    return serialize(doc)


@router.patch("/{opp_id}/status")
async def update_opp_status(opp_id: str, payload: OpportunityStatusPatch, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    await db.opportunities.update_one({"_id": oid(opp_id)}, {"$set": {"status": payload.status, "updated_at": utc_iso()}})
    doc = await db.opportunities.find_one({"_id": oid(opp_id)})
    await _enrich(db, doc)
    await log_activity(db, current, f"Opportunity → {payload.status}", "Opportunity Hub", target=doc["title"])
    return serialize(doc)


@router.delete("/{opp_id}")
async def delete_opp(opp_id: str, current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    doc = await db.opportunities.find_one({"_id": oid(opp_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    await db.opportunities.delete_one({"_id": oid(opp_id)})
    await log_activity(db, current, "Deleted opportunity", "Opportunity Hub", target=doc["title"])
    return {"ok": True}


@router.get("/stats/overview")
async def opp_stats(current: UserPublic = Depends(get_current_user)):
    db = get_db()
    async def c(q): return await db.opportunities.count_documents(q)
    return {
        "open":        await c({"status": "open"}),
        "assigned":    await c({"status": "assigned"}),
        "in_progress": await c({"status": "in_progress"}),
        "won":         await c({"status": "won"}),
        "lost":        await c({"status": "lost"}),
        "mine":        await c({"assignee_id": current.id, "status": {"$nin": ["won", "lost", "closed"]}}),
    }
