"""WavyGo OS backend API tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://wavygo-foundation.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

FOUNDER = {"email": "anilanand635@gmail.com", "password": "Wavygo@2026"}
ADMIN = {"email": "admin@wavygo.in", "password": "Wavygo@2026"}
MANAGER = {"email": "manager@wavygo.in", "password": "Wavygo@2026"}
EMPLOYEE = {"email": "employee@wavygo.in", "password": "Wavygo@2026"}
INTERN = {"email": "intern@wavygo.in", "password": "Wavygo@2026"}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def _login(s, creds):
    r = s.post(f"{API}/auth/login", json={**creds, "remember": True}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and "refresh_token" in data and "user" in data
    return data


# ---------- Health & Public ----------
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_live_kpis_is_public(s):
    r = s.get(f"{API}/dashboard/live-kpis")
    assert r.status_code == 200
    data = r.json()
    assert "kpis" in data
    assert len(data["kpis"]) == 5


# ---------- Auth ----------
def test_login_founder_success(s):
    data = _login(s, FOUNDER)
    assert data["user"]["email"] == FOUNDER["email"]
    assert data["user"]["role"] == "Founder"


def test_login_all_roles(s):
    for creds, role in [(ADMIN, "Admin"), (MANAGER, "Manager"), (EMPLOYEE, "Employee"), (INTERN, "Intern")]:
        d = _login(s, creds)
        assert d["user"]["role"] == role, f"{creds['email']} expected {role}, got {d['user']['role']}"


def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": FOUNDER["email"], "password": "wrong"})
    assert r.status_code == 401


def test_me_invalid_token(s):
    r = s.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert r.status_code == 401


def test_me_valid(s):
    d = _login(s, FOUNDER)
    r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {d['access_token']}"})
    assert r.status_code == 200
    assert r.json()["email"] == FOUNDER["email"]


def test_refresh_flow(s):
    d = _login(s, FOUNDER)
    r = s.post(f"{API}/auth/refresh", json={"refresh_token": d["refresh_token"]})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body and body["access_token"]


def test_refresh_invalid(s):
    r = s.post(f"{API}/auth/refresh", json={"refresh_token": "bad.token"})
    assert r.status_code == 401


# ---------- Role guards ----------
def test_users_list_founder_200(s):
    d = _login(s, FOUNDER)
    r = s.get(f"{API}/users", headers={"Authorization": f"Bearer {d['access_token']}"})
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list) and len(users) >= 5


def test_users_list_intern_403(s):
    d = _login(s, INTERN)
    r = s.get(f"{API}/users", headers={"Authorization": f"Bearer {d['access_token']}"})
    assert r.status_code == 403


def test_users_list_employee_403(s):
    d = _login(s, EMPLOYEE)
    r = s.get(f"{API}/users", headers={"Authorization": f"Bearer {d['access_token']}"})
    assert r.status_code == 403


def test_users_list_manager_200(s):
    d = _login(s, MANAGER)
    r = s.get(f"{API}/users", headers={"Authorization": f"Bearer {d['access_token']}"})
    assert r.status_code == 200


# ---------- Dashboard stats (authed) ----------
def test_dashboard_stats_requires_auth(s):
    r = s.get(f"{API}/dashboard/stats")
    assert r.status_code in (401, 403)


def test_dashboard_stats_authed(s):
    d = _login(s, FOUNDER)
    r = s.get(f"{API}/dashboard/stats", headers={"Authorization": f"Bearer {d['access_token']}"})
    assert r.status_code == 200
    body = r.json()
    assert len(body["kpis"]) == 5
    keys = {k["key"] for k in body["kpis"]}
    assert keys == {"revenue", "bookings", "customers", "vehicles", "vendors"}


# ---------- Notifications & Activity ----------
def test_notifications_endpoints(s):
    d = _login(s, FOUNDER)
    h = {"Authorization": f"Bearer {d['access_token']}"}
    r = s.get(f"{API}/notifications", headers=h)
    assert r.status_code == 200
    r2 = s.get(f"{API}/notifications/unread-count", headers=h)
    assert r2.status_code == 200
    assert "count" in r2.json() or "unread" in r2.json()


def test_activity(s):
    d = _login(s, FOUNDER)
    h = {"Authorization": f"Bearer {d['access_token']}"}
    r = s.get(f"{API}/activity", headers=h)
    assert r.status_code == 200


# ---------- Settings ----------
def test_settings_company(s):
    d = _login(s, FOUNDER)
    h = {"Authorization": f"Bearer {d['access_token']}"}
    r = s.get(f"{API}/settings/company", headers=h)
    assert r.status_code == 200


# ---------- Profile update + password reset roundtrip ----------
def test_update_profile_and_password_roundtrip(s):
    d = _login(s, EMPLOYEE)
    h = {"Authorization": f"Bearer {d['access_token']}"}
    # update profile
    r = s.patch(f"{API}/users/me", json={"phone": "+919999999999", "designation": "QA Tester"}, headers=h)
    assert r.status_code == 200
    assert r.json()["phone"] == "+919999999999"

    # change password to new
    new_pwd = "Wavygo@2026_TMP"
    r = s.post(f"{API}/users/me/password", json={"current_password": EMPLOYEE["password"], "new_password": new_pwd}, headers=h)
    assert r.status_code == 200

    # re-login with new
    d2 = _login(s, {"email": EMPLOYEE["email"], "password": new_pwd})
    h2 = {"Authorization": f"Bearer {d2['access_token']}"}

    # restore
    r = s.post(f"{API}/users/me/password", json={"current_password": new_pwd, "new_password": EMPLOYEE["password"]}, headers=h2)
    assert r.status_code == 200

    # confirm restored
    _login(s, EMPLOYEE)
