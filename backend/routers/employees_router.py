from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from db import get_db
from auth_utils import get_current_user, require_roles, hash_password
from models import UserPublic
from models_part2 import DepartmentIn, EmployeeInviteIn, AttendanceIn, LeaveIn, PerformanceIn
from hub_utils import serialize, serialize_many, oid, utc_iso, log_activity, notify

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("")
async def list_employees(q: str | None = None, department: str | None = None, role: str | None = None,
                         current: UserPublic = Depends(get_current_user)):
    db = get_db()
    query = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"designation": {"$regex": q, "$options": "i"}},
        ]
    if department: query["department"] = department
    if role: query["role"] = role
    docs = await db.users.find(query, {"password_hash": 0}).sort("created_at", -1).to_list(500)
    return serialize_many(docs, drop=("password_hash",))


@router.post("/invite", status_code=201)
async def invite_employee(payload: EmployeeInviteIn,
                          current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "Email already exists")
    default_pw = "Wavygo@2026"
    doc = {
        "email": email,
        "name": payload.name.strip(),
        "role": payload.role,
        "designation": payload.designation,
        "department": payload.department,
        "phone": payload.phone,
        "password_hash": hash_password(default_pw),
        "online": False,
        "created_at": utc_iso(),
        "updated_at": utc_iso(),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_activity(db, current, "Invited employee", "Employees", target=payload.name)
    await notify(db, None, "New teammate joined", f"{payload.name} was invited by {current.name} as {payload.role}.",
                 kind="success", link="/employees")
    return {**serialize(doc), "temp_password": default_pw}


@router.patch("/{employee_id}")
async def update_employee(employee_id: str, payload: dict,
                          current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    payload.pop("id", None); payload.pop("_id", None); payload.pop("password_hash", None); payload.pop("email", None)
    payload["updated_at"] = utc_iso()
    res = await db.users.update_one({"_id": oid(employee_id)}, {"$set": payload})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    doc = await db.users.find_one({"_id": oid(employee_id)}, {"password_hash": 0})
    await log_activity(db, current, "Updated employee", "Employees", target=doc["name"])
    return serialize(doc)


# -------- Departments --------

@router.get("/departments/list")
async def list_departments(current: UserPublic = Depends(get_current_user)):
    db = get_db()
    docs = await db.departments.find().sort("name", 1).to_list(200)
    # enrich head_name & headcount
    out = []
    for d in docs:
        head_name = None
        if d.get("head_id"):
            try:
                u = await db.users.find_one({"_id": ObjectId(d["head_id"])}, {"name": 1})
                head_name = u["name"] if u else None
            except Exception: pass
        headcount = await db.users.count_documents({"department": d["name"]})
        out.append({**serialize(d), "head_name": head_name, "headcount": headcount})
    return out


@router.post("/departments/list", status_code=201)
async def create_department(payload: DepartmentIn,
                            current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = utc_iso()
    res = await db.departments.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_activity(db, current, "Created department", "Employees", target=doc["name"])
    return serialize(doc)


# -------- Attendance --------

@router.get("/attendance/records")
async def list_attendance(employee_id: str | None = None, date: str | None = None,
                          current: UserPublic = Depends(get_current_user)):
    db = get_db()
    q = {}
    if employee_id: q["employee_id"] = employee_id
    if date: q["date"] = date
    docs = await db.attendance.find(q).sort("date", -1).to_list(500)
    return serialize_many(docs)


@router.post("/attendance/records", status_code=201)
async def add_attendance(payload: AttendanceIn, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = utc_iso()
    # Upsert by employee+date
    await db.attendance.update_one(
        {"employee_id": doc["employee_id"], "date": doc["date"]},
        {"$set": doc}, upsert=True,
    )
    emp = await db.users.find_one({"_id": oid(doc["employee_id"])}, {"name": 1})
    await log_activity(db, current, f"Attendance · {doc['status']}", "Employees",
                       target=f"{emp['name'] if emp else '—'} · {doc['date']}")
    return {"ok": True}


# -------- Leave --------

@router.get("/leave/requests")
async def list_leave(status: str | None = None, employee_id: str | None = None,
                     current: UserPublic = Depends(get_current_user)):
    db = get_db()
    q = {}
    if status: q["status"] = status
    if employee_id: q["employee_id"] = employee_id
    docs = await db.leave_requests.find(q).sort("created_at", -1).to_list(500)
    out = []
    for d in docs:
        emp = await db.users.find_one({"_id": ObjectId(d["employee_id"])}, {"name": 1, "photo": 1}) if d.get("employee_id") else None
        out.append({**serialize(d), "employee_name": emp["name"] if emp else None, "employee_photo": emp.get("photo") if emp else None})
    return out


@router.post("/leave/requests", status_code=201)
async def create_leave(payload: LeaveIn, current: UserPublic = Depends(get_current_user)):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = utc_iso()
    doc["updated_at"] = utc_iso()
    res = await db.leave_requests.insert_one(doc)
    doc["_id"] = res.inserted_id
    emp = await db.users.find_one({"_id": oid(doc["employee_id"])}, {"name": 1})
    await log_activity(db, current, "Leave requested", "Employees", target=f"{emp['name'] if emp else '—'} · {doc['from_date']} → {doc['to_date']}")
    await notify(db, None, "Leave request", f"{emp['name'] if emp else 'Employee'} requested {doc['kind']} leave from {doc['from_date']} to {doc['to_date']}.",
                 kind="warning", link="/employees")
    return serialize(doc)


@router.patch("/leave/requests/{leave_id}")
async def update_leave(leave_id: str, payload: dict,
                       current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    status = payload.get("status")
    if status not in {"pending", "approved", "rejected"}:
        raise HTTPException(400, "Invalid status")
    await db.leave_requests.update_one({"_id": oid(leave_id)}, {"$set": {"status": status, "updated_at": utc_iso()}})
    doc = await db.leave_requests.find_one({"_id": oid(leave_id)})
    emp = await db.users.find_one({"_id": ObjectId(doc["employee_id"])}, {"name": 1}) if doc.get("employee_id") else None
    await log_activity(db, current, f"Leave {status}", "Employees", target=emp["name"] if emp else None)
    if emp and doc.get("employee_id"):
        await notify(db, doc["employee_id"], f"Your leave was {status}",
                     f"{current.name} {status} your leave request {doc['from_date']} → {doc['to_date']}",
                     kind="success" if status == "approved" else "warning", link="/employees")
    return serialize(doc)


# -------- Performance --------

@router.get("/performance/reviews")
async def list_performance(employee_id: str | None = None,
                           current: UserPublic = Depends(get_current_user)):
    db = get_db()
    q = {}
    if employee_id: q["employee_id"] = employee_id
    docs = await db.performance_reviews.find(q).sort("created_at", -1).to_list(300)
    out = []
    for d in docs:
        emp = await db.users.find_one({"_id": ObjectId(d["employee_id"])}, {"name": 1, "designation": 1, "photo": 1}) if d.get("employee_id") else None
        out.append({**serialize(d), "employee_name": emp["name"] if emp else None,
                    "employee_designation": emp.get("designation") if emp else None,
                    "employee_photo": emp.get("photo") if emp else None})
    return out


@router.post("/performance/reviews", status_code=201)
async def create_performance(payload: PerformanceIn,
                             current: UserPublic = Depends(require_roles("Founder", "Admin", "Manager"))):
    db = get_db()
    doc = payload.model_dump()
    doc["created_at"] = utc_iso()
    doc["reviewer_id"] = current.id
    doc["reviewer_name"] = current.name
    res = await db.performance_reviews.insert_one(doc)
    doc["_id"] = res.inserted_id
    emp = await db.users.find_one({"_id": oid(doc["employee_id"])}, {"name": 1})
    await log_activity(db, current, "Performance review recorded", "Employees",
                       target=f"{emp['name'] if emp else '—'} · {doc['period']}")
    if emp and doc.get("employee_id"):
        await notify(db, doc["employee_id"], "Performance review saved",
                     f"{current.name} saved your {doc['period']} review.", kind="info", link="/employees")
    return serialize(doc)


# -------- Overview stats --------

@router.get("/stats/overview")
async def employees_overview(current: UserPublic = Depends(get_current_user)):
    db = get_db()
    total = await db.users.count_documents({})
    online = await db.users.count_documents({"online": True})
    by_role = {}
    async for u in db.users.find({}, {"role": 1}):
        by_role[u.get("role", "Employee")] = by_role.get(u.get("role", "Employee"), 0) + 1
    pending_leave = await db.leave_requests.count_documents({"status": "pending"})
    return {
        "total": total,
        "online": online,
        "by_role": [{"role": k, "count": v} for k, v in by_role.items()],
        "pending_leave": pending_leave,
        "departments": await db.departments.count_documents({}),
    }
