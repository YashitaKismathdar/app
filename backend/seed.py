from __future__ import annotations
"""Idempotent seed for role accounts, sample notifications & activity logs."""
import os
from datetime import timedelta
from bson import ObjectId

from db import get_db, utc_now
from auth_utils import hash_password


ROLE_ACCOUNTS = [
    # Real founder account uses env-provided credentials.
    {"role": "Founder", "email_env": "FOUNDER_EMAIL", "password_env": "FOUNDER_PASSWORD",
     "name_env": "FOUNDER_NAME", "designation": "Founder & CEO", "department": "Executive"},
    {"role": "Admin", "email": "admin@wavygo.in", "password": "Wavygo@2026",
     "name": "Priya Sharma", "designation": "Head of Operations", "department": "Admin"},
    {"role": "Manager", "email": "manager@wavygo.in", "password": "Wavygo@2026",
     "name": "Rahul Verma", "designation": "City Manager – Patna", "department": "Operations"},
    {"role": "Employee", "email": "employee@wavygo.in", "password": "Wavygo@2026",
     "name": "Sneha Kumari", "designation": "Fleet Executive", "department": "Fleet"},
    {"role": "Intern", "email": "intern@wavygo.in", "password": "Wavygo@2026",
     "name": "Aditya Singh", "designation": "Product Intern", "department": "Product"},
]


async def _ensure_user(db, email: str, password: str, name: str, role: str, designation: str, department: str) -> str:
    existing = await db.users.find_one({"email": email})
    doc = {
        "email": email,
        "name": name,
        "role": role,
        "designation": designation,
        "department": department,
        "online": role == "Founder",
        "updated_at": utc_now().isoformat(),
    }
    if existing is None:
        doc["password_hash"] = hash_password(password)
        doc["created_at"] = utc_now().isoformat()
        res = await db.users.insert_one(doc)
        return str(res.inserted_id)
    # Update password if changed, keep other fields fresh
    updates = dict(doc)
    from auth_utils import verify_password
    if not verify_password(password, existing.get("password_hash", "")):
        updates["password_hash"] = hash_password(password)
    await db.users.update_one({"_id": existing["_id"]}, {"$set": updates})
    return str(existing["_id"])


async def seed_all():
    db = get_db()

    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index(
        "role", unique=True,
        partialFilterExpression={"role": "Founder"}, name="unique_founder",
    )
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.activity_logs.create_index([("created_at", -1)])
    await db.sessions.create_index("refresh_token_id")

    # Safety: warn (never crash) if more than one Founder somehow exists.
    founder_count = await db.users.count_documents({"role": "Founder"})
    if founder_count > 1:
        import logging
        logging.getLogger("wavygo").critical(
            "RBAC invariant violated: %d Founder accounts exist (expected exactly 1).", founder_count
        )

    founder_id: str | None = None
    for spec in ROLE_ACCOUNTS:
        if "email_env" in spec:
            email = os.environ.get(spec["email_env"], "founder@wavygo.in")
            password = os.environ.get(spec["password_env"], "Wavygo@2026")
            name = os.environ.get(spec["name_env"], "Founder")
        else:
            email = spec["email"]; password = spec["password"]; name = spec["name"]
        uid = await _ensure_user(db, email, password, name, spec["role"], spec["designation"], spec["department"])
        if spec["role"] == "Founder":
            founder_id = uid

    # Seed sample notifications (only once)
    if await db.notifications.count_documents({}) == 0 and founder_id:
        samples = [
            {"title": "Welcome to WavyGo OS", "body": "Your permanent operating system is live. Explore the modules from the sidebar.", "kind": "success"},
            {"title": "3 new vendor applications", "body": "Patna region has 3 pending vendor applications awaiting review.", "kind": "info", "link": "/marketplace"},
            {"title": "Fleet health alert", "body": "5 vehicles are due for scheduled maintenance this week.", "kind": "warning", "link": "/marketplace"},
            {"title": "Monthly report ready", "body": "January 2026 financial report is ready to download.", "kind": "info", "link": "/finance"},
            {"title": "New opportunity", "body": "Bihar Tourism Board reached out for a fleet partnership.", "kind": "success", "link": "/opportunity-hub"},
        ]
        now = utc_now()
        for i, s in enumerate(samples):
            await db.notifications.insert_one({
                **s,
                "user_id": founder_id,
                "read": False,
                "created_at": (now - timedelta(hours=i * 3)).isoformat(),
            })

    # Seed sample activity logs
    if await db.activity_logs.count_documents({}) == 0 and founder_id:
        founder_doc = await db.users.find_one({"_id": ObjectId(founder_id)})
        samples = [
            {"action": "Signed in", "module": "Auth", "target": "Web session"},
            {"action": "Reviewed opportunity", "module": "Opportunity Hub", "target": "Bihar Tourism Board"},
            {"action": "Approved vendor", "module": "Marketplace", "target": "GreenWheels Patna"},
            {"action": "Published announcement", "module": "WavyGo Connect", "target": "Q1 Kickoff"},
            {"action": "Adjusted pricing", "module": "Finance", "target": "Weekly Rental Plan"},
        ]
        now = utc_now()
        for i, s in enumerate(samples):
            await db.activity_logs.insert_one({
                **s,
                "user_id": founder_id,
                "user_name": founder_doc["name"],
                "user_role": "Founder",
                "created_at": (now - timedelta(hours=i * 2 + 1)).isoformat(),
            })
