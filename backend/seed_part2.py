"""Part 2 seed — idempotent. Populates cities, vendors, vehicles, customers, bookings,
pricing, coupons, KYC requests, support tickets, reviews, tasks, departments, leave,
performance, opportunities and WavyGo Connect channels."""
from datetime import timedelta, datetime, timezone
from bson import ObjectId
from db import get_db, utc_now
from hub_utils import utc_iso


CITIES = [
    {"name": "Patna", "state": "Bihar", "status": "active"},
    {"name": "Gaya", "state": "Bihar", "status": "active"},
    {"name": "Muzaffarpur", "state": "Bihar", "status": "active"},
    {"name": "Bhagalpur", "state": "Bihar", "status": "active"},
    {"name": "Darbhanga", "state": "Bihar", "status": "active"},
    {"name": "Purnia", "state": "Bihar", "status": "planned"},
]

VENDOR_SEEDS = [
    {"name": "GreenWheels Patna",     "contact_name": "Ravi Kumar",   "email": "ravi@greenwheels.in",  "phone": "+91 90000 11111", "city": "Patna",       "kyc_status": "approved", "rating": 4.7},
    {"name": "Bihar E-Motion",        "contact_name": "Meena Sinha",  "email": "meena@ebihar.in",      "phone": "+91 90000 22222", "city": "Gaya",        "kyc_status": "approved", "rating": 4.5},
    {"name": "GangaRide Fleet",       "contact_name": "Alok Yadav",   "email": "alok@gangaride.in",    "phone": "+91 90000 33333", "city": "Muzaffarpur", "kyc_status": "pending",  "rating": 4.3},
    {"name": "Nalanda Mobility",      "contact_name": "Pooja Devi",   "email": "pooja@nalandamob.in",  "phone": "+91 90000 44444", "city": "Bhagalpur",   "kyc_status": "approved", "rating": 4.6},
    {"name": "Mithila EV Rentals",    "contact_name": "Sanjay Mishra","email": "sanjay@mithila.in",    "phone": "+91 90000 55555", "city": "Darbhanga",   "kyc_status": "approved", "rating": 4.4},
]

CUSTOMER_SEEDS = [
    ("Rohit Sharma",    "rohit.s@example.com",    "+91 98000 11111", "Patna",       "approved"),
    ("Ananya Verma",    "ananya.v@example.com",   "+91 98000 22222", "Patna",       "approved"),
    ("Vikas Choudhary", "vikas.c@example.com",    "+91 98000 33333", "Gaya",        "pending"),
    ("Neha Rani",       "neha.r@example.com",     "+91 98000 44444", "Muzaffarpur", "approved"),
    ("Kunal Gupta",     "kunal.g@example.com",    "+91 98000 55555", "Bhagalpur",   "approved"),
    ("Ritu Kumari",     "ritu.k@example.com",     "+91 98000 66666", "Darbhanga",   "pending"),
    ("Sameer Anand",    "sameer.a@example.com",   "+91 98000 77777", "Patna",       "approved"),
    ("Priya Raj",       "priya.r@example.com",    "+91 98000 88888", "Gaya",        "approved"),
]

VEHICLE_MODELS = [
    ("Ola S1 Pro",    "scooter", 45, 449),
    ("TVS iQube",     "scooter", 40, 399),
    ("Ather 450X",    "scooter", 55, 549),
    ("Bajaj Chetak",  "scooter", 42, 425),
    ("Hero Optima",   "ebike",   30, 299),
    ("Ampere Zeal",   "scooter", 35, 349),
]

PRICING = [
    {"name": "Starter",  "city": "Patna",       "hourly": 30, "daily": 299, "weekly": 1499, "monthly": 4999, "active": True},
    {"name": "Premium",  "city": "Patna",       "hourly": 55, "daily": 549, "weekly": 2999, "monthly": 8999, "active": True},
    {"name": "Weekend",  "city": "Gaya",        "hourly": 40, "daily": 399, "weekly": 1899, "monthly": 5999, "active": True},
    {"name": "Standard", "city": "Muzaffarpur", "hourly": 35, "daily": 349, "weekly": 1699, "monthly": 5499, "active": True},
]

COUPONS = [
    {"code": "WAVYGO25", "discount_pct": 25, "usage_limit": 500, "used_count": 78,  "active": True},
    {"code": "PATNA10",  "discount_pct": 10, "usage_limit": 1000, "used_count": 302, "active": True},
    {"code": "STUDENT",  "discount_pct": 20, "usage_limit": 300, "used_count": 41,  "active": True},
]

DEPARTMENTS = [
    {"name": "Executive",  "description": "Founding office and leadership"},
    {"name": "Operations", "description": "City ops, dispatch, and vendor management"},
    {"name": "Fleet",      "description": "Vehicle onboarding, maintenance, and health"},
    {"name": "Product",    "description": "Product, design and engineering"},
    {"name": "Admin",      "description": "HR, finance operations, compliance"},
]

OPPORTUNITY_SEEDS = [
    {"title": "Bihar Tourism Board pilot",       "type": "Partnership",      "organisation": "Bihar Tourism", "description": "Fleet partnership for tourist rentals across heritage circuit.", "value_lakhs": 42.0, "status": "in_progress", "deadline": "2026-03-15"},
    {"title": "Startup India Seed Fund",         "type": "Grant",            "organisation": "DPIIT",         "description": "Seed grant application for mobility startups.",                   "value_lakhs": 50.0, "status": "assigned",    "deadline": "2026-02-28"},
    {"title": "IIT Patna Student Rentals",       "type": "Partnership",      "organisation": "IIT Patna",     "description": "Campus rental partnership across 3 hostels.",                     "value_lakhs": 18.0, "status": "open",        "deadline": "2026-04-20"},
    {"title": "TiE Bihar Pitch Day",             "type": "Competition",      "organisation": "TiE Bihar",     "description": "Regional pitch competition for early-stage startups.",             "value_lakhs": 10.0, "status": "open",        "deadline": "2026-03-05"},
    {"title": "SIDBI Green Mobility Scheme",     "type": "Government Scheme","organisation": "SIDBI",         "description": "EV mobility financing scheme.",                                    "value_lakhs": 75.0, "status": "assigned",    "deadline": "2026-05-01"},
    {"title": "Tata CSR – Green Cities",         "type": "CSR",              "organisation": "Tata Trusts",   "description": "CSR partnership for e-mobility in Tier-2 cities.",                 "value_lakhs": 30.0, "status": "won",         "deadline": "2026-01-10"},
    {"title": "IRCTC Last-Mile Tender",          "type": "Tender",           "organisation": "IRCTC",         "description": "Last-mile connectivity tender for Patna Junction.",                "value_lakhs": 78.0, "status": "in_progress", "deadline": "2026-03-31"},
    {"title": "Y Combinator Winter 26",          "type": "Accelerator",      "organisation": "Y Combinator",  "description": "Accelerator batch application.",                                   "value_lakhs": 100.0,"status": "open",        "deadline": "2026-08-15"},
]

TASK_SEEDS = [
    {"title": "Review vendor onboarding — GreenWheels Patna",  "status": "in_progress", "priority": "high",   "module": "Marketplace", "due_days": 0},
    {"title": "Approve fleet expansion budget",                 "status": "review",      "priority": "high",   "module": "Finance",     "due_days": 0},
    {"title": "Sign quarterly financial statement",             "status": "todo",        "priority": "urgent", "module": "Finance",     "due_days": 0},
    {"title": "City ops sync — Gaya",                           "status": "todo",        "priority": "medium", "module": "Operations",  "due_days": 1},
    {"title": "Kick off Q1 marketing campaign",                 "status": "in_progress", "priority": "medium", "module": "Marketing",   "due_days": 3},
    {"title": "Ship Task Board module",                         "status": "review",      "priority": "high",   "module": "Product",     "due_days": 2},
    {"title": "Interview: City Manager Purnia",                 "status": "todo",        "priority": "medium", "module": "Employees",   "due_days": 4},
    {"title": "Publish Q1 kickoff announcement",                "status": "completed",   "priority": "medium", "module": "Connect",     "due_days": -1},
    {"title": "Audit KYC backlog",                              "status": "in_progress", "priority": "low",    "module": "Marketplace", "due_days": 5},
    {"title": "Rider incentive scheme v2",                      "status": "todo",        "priority": "low",    "module": "Marketing",   "due_days": 7},
]

CHANNELS = [
    {"name": "announcements", "kind": "announcement", "description": "Company-wide announcements"},
    {"name": "general",       "kind": "channel",      "description": "Everyone. Everyday."},
    {"name": "operations",    "kind": "channel",      "description": "City ops, dispatch, vehicle health"},
    {"name": "product",       "kind": "channel",      "description": "Product, design and engineering"},
    {"name": "founders",      "kind": "group",        "description": "Founders + leadership"},
]

SAMPLE_MESSAGES = {
    "announcements": [
        "Welcome to WavyGo OS Part 2. Marketplace, Task Board, Employees, Opportunities and Connect are live.",
        "Fleet expansion approved for Muzaffarpur — 40 new vehicles being onboarded this week.",
    ],
    "general": [
        "Morning team — Patna hub crossed 2,000 daily bookings for the first time yesterday. 🎉",
        "Reminder: KYC backlog review at 4pm today.",
        "Anyone free to buddy-review the Q1 marketing brief?",
    ],
    "operations": [
        "Ola S1 Pro fleet moved to daily maintenance rotation.",
        "Gaya hub reporting 3 vehicles in maintenance — parts arriving tomorrow.",
    ],
    "product": [
        "Task Board kanban shipped. Feedback welcome in this channel.",
        "Marketplace analytics tab pushed — v1 uses booking aggregates.",
    ],
    "founders": [
        "IRCTC tender response due Feb 28. Aligning on positioning tomorrow.",
        "Bihar Tourism follow-up scheduled for Wednesday 11am.",
    ],
}


async def seed_part2():
    db = get_db()

    # Cities
    if await db.cities.count_documents({}) == 0:
        for c in CITIES:
            await db.cities.insert_one({**c, "created_at": utc_iso(), "updated_at": utc_iso()})

    # Vendors
    if await db.vendors.count_documents({}) == 0:
        for v in VENDOR_SEEDS:
            await db.vendors.insert_one({**v, "active": True, "created_at": utc_iso(), "updated_at": utc_iso()})

    # Vehicles (pinned to vendors)
    if await db.vehicles.count_documents({}) == 0:
        vendors = await db.vendors.find().to_list(100)
        plate_counter = 0
        for vendor in vendors:
            for i, (model, kind, hourly, daily) in enumerate(VEHICLE_MODELS):
                if i > 3:
                    break
                plate_counter += 1
                await db.vehicles.insert_one({
                    "model": model, "kind": kind,
                    "plate": f"BR{vendor['city'][:2].upper()}{1000 + plate_counter}",
                    "vendor_id": str(vendor["_id"]),
                    "city": vendor["city"],
                    "hourly_rate": hourly, "daily_rate": daily,
                    "status": "available" if i != 3 else "maintenance",
                    "created_at": utc_iso(), "updated_at": utc_iso(),
                })

    # Customers
    if await db.customers.count_documents({}) == 0:
        for name, email, phone, city, kyc in CUSTOMER_SEEDS:
            await db.customers.insert_one({
                "name": name, "email": email, "phone": phone, "city": city, "kyc_status": kyc,
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Bookings (spread across last 14 days)
    if await db.bookings.count_documents({}) == 0:
        vehicles = await db.vehicles.find().to_list(100)
        customers = await db.customers.find().to_list(100)
        now = utc_now()
        import random
        random.seed(42)
        statuses = ["completed"] * 6 + ["active"] * 2 + ["confirmed"] * 2 + ["pending", "cancelled"]
        for i in range(60):
            v = random.choice(vehicles); c = random.choice(customers)
            start = now - timedelta(days=random.randint(0, 13), hours=random.randint(0, 20))
            end = start + timedelta(hours=random.randint(2, 48))
            amount = round(v["daily_rate"] * random.uniform(0.6, 2.4), 0)
            await db.bookings.insert_one({
                "customer_id": str(c["_id"]),
                "customer_name": c["name"],
                "vehicle_id": str(v["_id"]),
                "vehicle_label": f"{v['model']} · {v['plate']}",
                "vendor_id": v.get("vendor_id"),
                "city": v["city"],
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
                "amount": amount,
                "status": random.choice(statuses),
                "created_at": start.isoformat(),
                "updated_at": end.isoformat(),
            })

    # Pricing
    if await db.pricing.count_documents({}) == 0:
        for p in PRICING:
            await db.pricing.insert_one({**p, "created_at": utc_iso(), "updated_at": utc_iso()})

    # Coupons
    if await db.coupons.count_documents({}) == 0:
        for c in COUPONS:
            await db.coupons.insert_one({**c, "created_at": utc_iso(), "updated_at": utc_iso()})

    # KYC (pull pending vendors/customers)
    if await db.kyc_requests.count_documents({}) == 0:
        async for v in db.vendors.find({"kyc_status": "pending"}):
            await db.kyc_requests.insert_one({
                "subject_type": "vendor", "subject_id": str(v["_id"]), "subject_name": v["name"],
                "doc_type": "gst", "status": "pending", "notes": "GST + CIN pending verification",
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })
        async for c in db.customers.find({"kyc_status": "pending"}):
            await db.kyc_requests.insert_one({
                "subject_type": "customer", "subject_id": str(c["_id"]), "subject_name": c["name"],
                "doc_type": "aadhaar", "status": "pending", "notes": "Aadhaar OCR flagged for manual review",
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Support tickets
    if await db.support_tickets.count_documents({}) == 0:
        seeds = [
            ("Refund not credited",       "Booked a scooter last Friday and cancelled within 10 minutes. Refund still pending.", "high",   "open"),
            ("Vehicle not started",       "Vehicle in Kankarbagh area not starting after unlock.",                                "urgent", "in_progress"),
            ("KYC verification stuck",    "Customer KYC has been in review for 3 days.",                                          "medium", "open"),
            ("App crash on payment page", "Payment page crashes on Android 12 devices.",                                          "high",   "in_progress"),
            ("Extend rental request",     "Would like to extend a monthly rental by 2 weeks.",                                    "low",    "resolved"),
        ]
        customers = await db.customers.find().to_list(20)
        import random; random.seed(1)
        for i, (subj, desc, prio, st) in enumerate(seeds):
            c = customers[i % len(customers)] if customers else None
            await db.support_tickets.insert_one({
                "subject": subj, "description": desc, "priority": prio, "status": st,
                "customer_id": str(c["_id"]) if c else None,
                "customer_name": c["name"] if c else None,
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Reviews
    if await db.reviews.count_documents({}) == 0:
        vendors = await db.vendors.find().to_list(20)
        samples = [
            ("Rohit Sharma",   4.7, "Smooth pickup, well-maintained vehicle."),
            ("Ananya Verma",   4.9, "Genuinely felt like a premium experience."),
            ("Vikas Choudhary",4.2, "Great app, but scooter had a stuck brake."),
            ("Neha Rani",      5.0, "Best rental experience in Bihar."),
            ("Kunal Gupta",    4.4, "Onboarding is quick. Wish they had more scooters near AIIMS Patna."),
        ]
        for i, (name, rating, comment) in enumerate(samples):
            v = vendors[i % len(vendors)]
            await db.reviews.insert_one({
                "customer_name": name, "vendor_id": str(v["_id"]), "vendor_name": v["name"],
                "rating": rating, "comment": comment,
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Departments
    if await db.departments.count_documents({}) == 0:
        for d in DEPARTMENTS:
            await db.departments.insert_one({**d, "created_at": utc_iso()})

    # Tasks
    if await db.tasks.count_documents({}) == 0:
        users = await db.users.find({}, {"name": 1, "role": 1}).to_list(50)
        founder = next((u for u in users if u.get("role") == "Founder"), users[0] if users else None)
        import random; random.seed(2)
        now = utc_now()
        for t in TASK_SEEDS:
            assignee = random.choice(users) if users else None
            due = (now + timedelta(days=t["due_days"])).isoformat() if t["due_days"] is not None else None
            await db.tasks.insert_one({
                "title": t["title"], "description": "",
                "status": t["status"], "priority": t["priority"], "module": t["module"],
                "assignee_id": str(assignee["_id"]) if assignee else None,
                "reporter_id": str(founder["_id"]) if founder else None,
                "due_date": due, "tags": [t["module"].lower()],
                "subtasks": [], "comments": [],
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Leave requests
    if await db.leave_requests.count_documents({}) == 0:
        users = await db.users.find({"role": {"$in": ["Employee", "Intern", "Manager"]}}).to_list(20)
        seeds = [
            ("casual", "Personal work", "pending"),
            ("sick",   "Fever",         "approved"),
            ("earned", "Family trip",   "pending"),
        ]
        import random; random.seed(3)
        now = utc_now()
        for u, (kind, reason, status) in zip(users[:3], seeds):
            fd = (now + timedelta(days=random.randint(2, 10))).date().isoformat()
            td = (now + timedelta(days=random.randint(11, 15))).date().isoformat()
            await db.leave_requests.insert_one({
                "employee_id": str(u["_id"]), "from_date": fd, "to_date": td,
                "kind": kind, "reason": reason, "status": status,
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Performance reviews
    if await db.performance_reviews.count_documents({}) == 0:
        users = await db.users.find({"role": {"$in": ["Employee", "Manager"]}}).to_list(10)
        for i, u in enumerate(users[:5]):
            await db.performance_reviews.insert_one({
                "employee_id": str(u["_id"]), "period": "Q4-2025",
                "score": round(3.6 + (i * 0.2), 1),
                "highlights": "Consistent city ops execution and strong vendor relationships.",
                "growth_areas": "Delegate more to interns; document standard playbooks.",
                "reviewer_id": None, "reviewer_name": "Founder",
                "created_at": utc_iso(),
            })

    # Opportunities
    if await db.opportunities.count_documents({}) == 0:
        users = await db.users.find({}, {"name": 1}).to_list(20)
        import random; random.seed(4)
        for o in OPPORTUNITY_SEEDS:
            assignee = random.choice(users) if o["status"] in ("assigned", "in_progress", "won") else None
            await db.opportunities.insert_one({
                **o,
                "assignee_id": str(assignee["_id"]) if assignee else None,
                "documents": [],
                "created_at": utc_iso(), "updated_at": utc_iso(),
            })

    # Connect channels
    if await db.channels.count_documents({}) == 0:
        users = await db.users.find({}, {"role": 1}).to_list(50)
        all_ids = [str(u["_id"]) for u in users]
        founder_ids = [str(u["_id"]) for u in users if u.get("role") in ("Founder", "Admin")]
        for c in CHANNELS:
            members = founder_ids if c["kind"] == "group" else all_ids
            await db.channels.insert_one({
                **c, "members": members,
                "created_by": all_ids[0] if all_ids else None,
                "created_at": utc_iso(), "last_message_at": utc_iso(),
            })

    # Sample messages
    if await db.messages.count_documents({}) == 0:
        users = await db.users.find({}, {"name": 1, "role": 1, "photo": 1}).to_list(50)
        import random; random.seed(5)
        now = utc_now()
        for ch in await db.channels.find().to_list(20):
            msgs = SAMPLE_MESSAGES.get(ch["name"], [])
            last_ts = None
            for i, body in enumerate(msgs):
                sender = random.choice(users) if users else None
                ts = (now - timedelta(hours=len(msgs) - i, minutes=random.randint(0, 45))).isoformat()
                await db.messages.insert_one({
                    "channel_id": str(ch["_id"]),
                    "channel_name": ch["name"],
                    "sender_id": str(sender["_id"]) if sender else None,
                    "sender_name": sender["name"] if sender else "System",
                    "sender_role": sender.get("role") if sender else None,
                    "sender_photo": sender.get("photo") if sender else None,
                    "body": body, "attachments": [],
                    "created_at": ts,
                })
                last_ts = ts
            if last_ts:
                await db.channels.update_one({"_id": ch["_id"]}, {"$set": {"last_message_at": last_ts, "last_body": msgs[-1][:120]}})

    # Indexes
    await db.bookings.create_index([("city", 1), ("status", 1), ("created_at", -1)])
    await db.vehicles.create_index([("vendor_id", 1), ("status", 1)])
    await db.tasks.create_index([("status", 1), ("assignee_id", 1), ("created_at", -1)])
    await db.messages.create_index([("channel_id", 1), ("created_at", -1)])
    await db.opportunities.create_index([("status", 1), ("deadline", 1)])
