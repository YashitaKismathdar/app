import requests

B = "http://localhost:8001/api"

def login(email):
    r = requests.post(f"{B}/auth/login", json={"email": email, "password": "Wavygo@2026"})
    return r.json()["access_token"]

def h(t):
    return {"Authorization": f"Bearer {t}"}

toks = {r: login(f"{r}@wavygo.in") for r in ["founder", "admin", "manager", "employee", "intern"]}
print("logins ok:", list(toks))

def code(method, path, role, **kw):
    r = requests.request(method, f"{B}{path}", headers=h(toks[role]), **kw)
    return r.status_code, r

results = []
def check(label, method, path, role, expect, **kw):
    sc, r = code(method, path, role, **kw)
    ok = sc == expect
    results.append(ok)
    body = "" if ok else r.text[:120]
    print(f"[{'PASS' if ok else 'FAIL'}] {label}: {role} {method} {path} -> {sc} (expect {expect}) {body}")
    return r

check("E change pw 403", "POST", "/users/me/password", "employee", 403, json={"current_password": "Wavygo@2026", "new_password": "Wavygo@2026"})
check("I change pw 403", "POST", "/users/me/password", "intern", 403, json={"current_password": "Wavygo@2026", "new_password": "Wavygo@2026"})
check("M change pw 200", "POST", "/users/me/password", "manager", 200, json={"current_password": "Wavygo@2026", "new_password": "Wavygo@2026"})

emp = requests.get(f"{B}/employees", headers=h(toks["founder"])).json()
emp_id = next(u["id"] for u in emp if u["role"] == "Employee")
r = check("Founder reset pw 200", "POST", f"/employees/{emp_id}/reset-password", "founder", 200)
if r.status_code == 200:
    print("   temp_password present:", "temp_password" in r.json())
check("Manager reset pw 403", "POST", f"/employees/{emp_id}/reset-password", "manager", 403)
check("Intern reset pw 403", "POST", f"/employees/{emp_id}/reset-password", "intern", 403)

check("Founder marketplace 200", "GET", "/marketplace/cities", "founder", 200)
check("Admin marketplace 403", "GET", "/marketplace/cities", "admin", 403)
check("Manager marketplace 403", "GET", "/marketplace/cities", "manager", 403)
check("Employee marketplace 403", "GET", "/marketplace/cities", "employee", 403)

check("Employee create channel 403", "POST", "/connect/channels", "employee", 403, json={"name": "x", "kind": "channel", "members": []})
check("Manager create channel 201", "POST", "/connect/channels", "manager", 201, json={"name": "mgr-chan", "kind": "channel", "members": []})
check("Manager create announcement 403", "POST", "/connect/channels", "manager", 403, json={"name": "ann", "kind": "announcement", "members": []})

check("Intern opportunities 403", "GET", "/opportunities", "intern", 403)
check("Employee opportunities 200", "GET", "/opportunities", "employee", 200)

check("Intern create task 403", "POST", "/tasks", "intern", 403, json={"title": "t"})
check("Employee create task 201", "POST", "/tasks", "employee", 201, json={"title": "emp task"})

check("Employee activity 403", "GET", "/activity", "employee", 403)
check("Intern activity 403", "GET", "/activity", "intern", 403)
check("Manager activity 200", "GET", "/activity", "manager", 200)

check("Admin register Admin 403", "POST", "/auth/register", "admin", 403, json={"email": "z1@w.in", "password": "Wavygo@2026", "name": "Z", "role": "Admin"})
check("Admin register Founder 403", "POST", "/auth/register", "admin", 403, json={"email": "z2@w.in", "password": "Wavygo@2026", "name": "Z", "role": "Founder"})
check("Employee register 403", "POST", "/auth/register", "employee", 403, json={"email": "z3@w.in", "password": "Wavygo@2026", "name": "Z", "role": "Employee"})

check("Manager invite 403", "POST", "/employees/invite", "manager", 403, json={"email": "inv1@w.in", "name": "Inv", "role": "Employee"})

r = check("Employee dashboard 200", "GET", "/dashboard/stats", "employee", 200)
if r.status_code == 200:
    d = r.json()
    keys = ["kpis", "cities", "tasks_today", "opportunities", "recent_notifications", "vendor_perf"]
    print("   dashboard keys present:", all(k in d for k in keys))

print(f"\n=== {sum(results)}/{len(results)} checks passed ===")
