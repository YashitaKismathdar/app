from fastapi import APIRouter, Depends
from auth_utils import get_current_user
from models import UserPublic

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/company")
async def company_info(_: UserPublic = Depends(get_current_user)):
    return {
        "name": "WAVYGO MOBILITY SERVICES PRIVATE LIMITED",
        "brand": "WavyGo OS",
        "cin": "U77100BR2025PTC077095",
        "industry": "Travel-Tech · Mobility · Vehicle Rental",
        "country": "India",
        "founded": "2025",
        "hq": "Patna, Bihar, India",
    }


@router.get("/roles")
async def roles(_: UserPublic = Depends(get_current_user)):
    return {
        "roles": [
            {"name": "Founder", "level": 100, "description": "Full access to every module and every action."},
            {"name": "Admin", "level": 80, "description": "Manage users, roles, finance and company data."},
            {"name": "Manager", "level": 60, "description": "Run city operations, approve vendors and tasks."},
            {"name": "Employee", "level": 40, "description": "Execute tasks and manage assigned modules."},
            {"name": "Intern", "level": 20, "description": "Read-only across most modules, limited write access."},
        ]
    }
