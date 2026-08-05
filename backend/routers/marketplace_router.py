from fastapi import APIRouter, Depends, HTTPException, Query
from db import get_db
from auth_utils import get_current_user, require_roles
from models import UserPublic
from models_part2 import (
    CityIn, VendorIn, VehicleIn, CustomerIn, BookingIn,
    PricingIn, CouponIn, KycIn, SupportIn, ReviewIn,
)
from hub_utils import serialize, serialize_many, oid, utc_iso, log_activity, notify

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


def _crud(collection_name: str, model_cls, module_name: str, title_field: str = "name"):
    """Generate a CRUD sub-router for a simple marketplace collection."""
    sub = APIRouter(prefix=f"/{collection_name}", tags=[f"marketplace-{collection_name}"])

    @sub.get("")
    async def list_items(q: str | None = None, limit: int = Query(200, ge=1, le=500),
                         current: UserPublic = Depends(get_current_user)):
        db = get_db()
        query = {}
        if q:
            query = {"$or": [{"name": {"$regex": q, "$options": "i"}}, {title_field: {"$regex": q, "$options": "i"}}]}
        docs = await db[collection_name].find(query).sort("created_at", -1).to_list(limit)
        return serialize_many(docs)

    @sub.post("", status_code=201)
    async def create_item(payload: model_cls, current: UserPublic = Depends(get_current_user)):
        db = get_db()
        doc = payload.model_dump()
        doc["created_at"] = utc_iso()
        doc["updated_at"] = utc_iso()
        res = await db[collection_name].insert_one(doc)
        doc["_id"] = res.inserted_id
        await log_activity(db, current, f"Created {module_name.rstrip('s')}", module_name, target=doc.get(title_field))
        return serialize(doc)

    @sub.get("/{item_id}")
    async def get_item(item_id: str, current: UserPublic = Depends(get_current_user)):
        db = get_db()
        doc = await db[collection_name].find_one({"_id": oid(item_id)})
        if not doc:
            raise HTTPException(404, "Not found")
        return serialize(doc)

    @sub.patch("/{item_id}")
    async def update_item(item_id: str, payload: dict, current: UserPublic = Depends(get_current_user)):
        db = get_db()
        payload["updated_at"] = utc_iso()
        payload.pop("id", None); payload.pop("_id", None); payload.pop("created_at", None)
        res = await db[collection_name].update_one({"_id": oid(item_id)}, {"$set": payload})
        if res.matched_count == 0:
            raise HTTPException(404, "Not found")
        doc = await db[collection_name].find_one({"_id": oid(item_id)})
        await log_activity(db, current, f"Updated {module_name.rstrip('s')}", module_name, target=doc.get(title_field))
        return serialize(doc)

    @sub.delete("/{item_id}")
    async def delete_item(item_id: str, current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
        db = get_db()
        doc = await db[collection_name].find_one({"_id": oid(item_id)})
        if not doc:
            raise HTTPException(404, "Not found")
        await db[collection_name].delete_one({"_id": oid(item_id)})
        await log_activity(db, current, f"Deleted {module_name.rstrip('s')}", module_name, target=doc.get(title_field))
        return {"ok": True}

    return sub


router.include_router(_crud("cities",   CityIn,     "Marketplace", "name"))
router.include_router(_crud("vendors",  VendorIn,   "Marketplace", "name"))
router.include_router(_crud("vehicles", VehicleIn,  "Marketplace", "plate"))
router.include_router(_crud("customers", CustomerIn, "Marketplace", "name"))
router.include_router(_crud("pricing",  PricingIn,  "Marketplace", "name"))
router.include_router(_crud("coupons",  CouponIn,   "Marketplace", "code"))
router.include_router(_crud("reviews",  ReviewIn,   "Marketplace", "customer_name"))


# -------- Bookings (custom because of business logic) --------

@router.get("/bookings")
async def list_bookings(status: str | None = None, city: str | None = None,
                        limit: int = Query(200, ge=1, le=500),
                        current: UserPublic = Depends(get_current_user)):
    db = get_db()
    q = {}
    if status: q["status"] = status
    if city: q["city"] = city
    docs = await db.bookings.find(q).sort("created_at", -1).to_list(limit)
    return serialize_many(docs)


@router.post("/bookings", status_code=201)
async def create_booking(payload: BookingIn, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    customer = await db.customers.find_one({"_id": oid(payload.customer_id)})
    vehicle = await db.vehicles.find_one({"_id": oid(payload.vehicle_id)})
    if not customer or not vehicle:
        raise HTTPException(400, "Invalid customer or vehicle")
    doc = payload.model_dump()
    doc["customer_name"] = customer["name"]
    doc["vehicle_label"] = f"{vehicle['model']} · {vehicle['plate']}"
    doc["vendor_id"] = vehicle.get("vendor_id")
    doc["created_at"] = utc_iso()
    doc["updated_at"] = utc_iso()
    res = await db.bookings.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_activity(db, current, "Created booking", "Marketplace", target=f"{doc['customer_name']} · {doc['vehicle_label']}")
    await notify(db, None, "New booking created", f"{doc['customer_name']} booked {doc['vehicle_label']} in {doc['city']}.", kind="success", link="/marketplace")
    return serialize(doc)


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, payload: dict, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    status = payload.get("status")
    if status not in {"pending", "confirmed", "active", "completed", "cancelled"}:
        raise HTTPException(400, "Invalid status")
    res = await db.bookings.update_one({"_id": oid(booking_id)}, {"$set": {"status": status, "updated_at": utc_iso()}})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    doc = await db.bookings.find_one({"_id": oid(booking_id)})
    await log_activity(db, current, f"Booking → {status}", "Marketplace", target=doc.get("customer_name"))
    return serialize(doc)


# -------- KYC (workflow) --------

@router.get("/kyc")
async def list_kyc(status: str | None = None, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    q = {}
    if status: q["status"] = status
    docs = await db.kyc_requests.find(q).sort("created_at", -1).to_list(300)
    return serialize_many(docs)


@router.post("/kyc", status_code=201)
async def create_kyc(payload: KycIn, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = utc_iso()
    doc["updated_at"] = utc_iso()
    res = await db.kyc_requests.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_activity(db, current, "KYC submitted", "Marketplace", target=doc["subject_name"])
    return serialize(doc)


@router.patch("/kyc/{kyc_id}")
async def update_kyc(kyc_id: str, payload: dict, current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    status = payload.get("status")
    if status not in {"pending", "approved", "rejected"}:
        raise HTTPException(400, "Invalid status")
    await db.kyc_requests.update_one({"_id": oid(kyc_id)}, {"$set": {"status": status, "updated_at": utc_iso()}})
    doc = await db.kyc_requests.find_one({"_id": oid(kyc_id)})
    # cascade to subject
    subject_col = "vendors" if doc["subject_type"] == "vendor" else "customers"
    try:
        await db[subject_col].update_one({"_id": oid(doc["subject_id"])}, {"$set": {"kyc_status": status}})
    except Exception:
        pass
    await log_activity(db, current, f"KYC {status}", "Marketplace", target=doc["subject_name"])
    await notify(db, None, f"KYC {status}", f"{doc['subject_name']} KYC marked {status}.",
                 kind="success" if status == "approved" else ("warning" if status == "rejected" else "info"),
                 link="/marketplace")
    return serialize(doc)


# -------- Support --------

@router.get("/support")
async def list_support(status: str | None = None, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    q = {}
    if status: q["status"] = status
    docs = await db.support_tickets.find(q).sort("created_at", -1).to_list(300)
    return serialize_many(docs)


@router.post("/support", status_code=201)
async def create_support(payload: SupportIn, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = utc_iso()
    doc["updated_at"] = utc_iso()
    res = await db.support_tickets.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_activity(db, current, "Support ticket opened", "Marketplace", target=doc["subject"])
    await notify(db, None, "New support ticket", doc["subject"], kind="warning", link="/marketplace")
    return serialize(doc)


@router.patch("/support/{tid}")
async def update_support(tid: str, payload: dict, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    payload["updated_at"] = utc_iso()
    payload.pop("id", None); payload.pop("_id", None); payload.pop("created_at", None)
    await db.support_tickets.update_one({"_id": oid(tid)}, {"$set": payload})
    doc = await db.support_tickets.find_one({"_id": oid(tid)})
    if payload.get("status"):
        await log_activity(db, current, f"Support → {payload['status']}", "Marketplace", target=doc["subject"])
    return serialize(doc)


# -------- Dashboard & analytics --------

@router.get("/dashboard")
async def marketplace_dashboard(current: UserPublic = Depends(get_current_user)):
    db = get_db()
    now_iso = utc_iso()[:10]  # YYYY-MM-DD

    async def count(col, q=None): return await db[col].count_documents(q or {})

    total_bookings = await count("bookings")
    active_bookings = await count("bookings", {"status": {"$in": ["confirmed", "active"]}})
    today_bookings = await count("bookings", {"created_at": {"$regex": f"^{now_iso}"}})
    completed_bookings = await count("bookings", {"status": "completed"})

    pipeline = [{"$group": {"_id": None, "sum": {"$sum": "$amount"}}}]
    revenue_agg = await db.bookings.aggregate(pipeline).to_list(1)
    total_revenue = revenue_agg[0]["sum"] if revenue_agg else 0

    return {
        "totals": {
            "vehicles": await count("vehicles"),
            "vendors": await count("vendors"),
            "customers": await count("customers"),
            "cities": await count("cities"),
            "bookings": total_bookings,
            "active_bookings": active_bookings,
            "today_bookings": today_bookings,
            "completed_bookings": completed_bookings,
            "revenue": total_revenue,
            "pending_kyc": await count("kyc_requests", {"status": "pending"}),
            "open_tickets": await count("support_tickets", {"status": {"$in": ["open", "in_progress"]}}),
        }
    }


@router.get("/analytics")
async def marketplace_analytics(current: UserPublic = Depends(get_current_user)):
    db = get_db()
    # Bookings by city
    city_pipe = [
        {"$group": {"_id": "$city", "bookings": {"$sum": 1}, "revenue": {"$sum": "$amount"}}},
        {"$sort": {"bookings": -1}},
        {"$limit": 10},
    ]
    by_city = await db.bookings.aggregate(city_pipe).to_list(20)
    # Bookings by status
    status_pipe = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    by_status = await db.bookings.aggregate(status_pipe).to_list(10)
    # Top vendors (by vehicles owned)
    vendor_pipe = [{"$group": {"_id": "$vendor_id", "vehicles": {"$sum": 1}}}, {"$sort": {"vehicles": -1}}, {"$limit": 6}]
    top_vendor_ids = await db.vehicles.aggregate(vendor_pipe).to_list(6)
    vendor_map = {}
    for v in top_vendor_ids:
        if v["_id"]:
            vdoc = await db.vendors.find_one({"_id": oid(v["_id"])})
            if vdoc:
                vendor_map[str(vdoc["_id"])] = {"name": vdoc["name"], "city": vdoc["city"], "rating": vdoc.get("rating", 4.5), "vehicles": v["vehicles"]}
    return {
        "by_city": [{"city": c["_id"], "bookings": c["bookings"], "revenue": c["revenue"]} for c in by_city],
        "by_status": [{"status": s["_id"], "count": s["count"]} for s in by_status],
        "top_vendors": list(vendor_map.values()),
    }
