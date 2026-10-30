"""Wallet endpoints: read balance, transaction ledger (sample data placeholder)."""
from fastapi import APIRouter, Depends

from middleware.auth import get_current_user

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("", dependencies=[Depends(get_current_user)])
def get_wallet(user=Depends(get_current_user)):
    """Return wallet balance and sample data indicator."""
    is_rider = user["role"] == "rider"
    balance = 14850.0 if is_rider else 5400.0
    return {
        "balance": balance,
        "currency": "NGN",
        "isSampleData": True,
        "label": "Sample data",
        "pendingPayout": 3200.0 if is_rider else 0.0,
        "totalEarnings": 48200.0 if is_rider else 0.0,
        "totalSpent": 0.0 if is_rider else 18600.0,
    }


@router.get("/transactions", dependencies=[Depends(get_current_user)])
def get_transactions(user=Depends(get_current_user)):
    """Return read-only transaction ledger with sample data."""
    is_rider = user["role"] == "rider"

    if is_rider:
        transactions = [
            {
                "id": "tx_r1",
                "type": "credit",
                "title": "Ride Fare - Wuse II to Central Area",
                "amount": 1200.0,
                "currency": "NGN",
                "status": "completed",
                "date": "2026-10-29T08:45:00Z",
                "reference": "OKD-R-88321",
                "isSampleData": True,
            },
            {
                "id": "tx_r2",
                "type": "credit",
                "title": "Ride Fare - Garki Market to Area 1",
                "amount": 800.0,
                "currency": "NGN",
                "status": "completed",
                "date": "2026-10-28T17:15:00Z",
                "reference": "OKD-R-87410",
                "isSampleData": True,
            },
            {
                "id": "tx_r3",
                "type": "debit",
                "title": "Weekly Bank Transfer Payout",
                "amount": -15000.0,
                "currency": "NGN",
                "status": "completed",
                "date": "2026-10-27T10:00:00Z",
                "reference": "PAY-OUT-4491",
                "isSampleData": True,
            },
            {
                "id": "tx_r4",
                "type": "credit",
                "title": "Ride Fare - Utako to Jabi Lake",
                "amount": 950.0,
                "currency": "NGN",
                "status": "completed",
                "date": "2026-10-26T14:20:00Z",
                "reference": "OKD-R-86201",
                "isSampleData": True,
            },
        ]
    else:
        transactions = [
            {
                "id": "tx_c1",
                "type": "debit",
                "title": "Okada Ride - Wuse Market to Maitama",
                "amount": -800.0,
                "currency": "NGN",
                "status": "completed",
                "date": "2026-10-29T09:10:00Z",
                "reference": "OKD-C-99120",
                "isSampleData": True,
            },
            {
                "id": "tx_c2",
                "type": "credit",
                "title": "Wallet Top-up via Card",
                "amount": 5000.0,
                "currency": "NGN",
                "status": "completed",
                "date": "2026-10-28T11:00:00Z",
                "reference": "TOP-UP-5520",
                "isSampleData": True,
            },
            {
                "id": "tx_c3",
                "type": "debit",
                "title": "Okada Ride - Banex Plaza to Garki",
                "amount": -1200.0,
                "currency": "NGN",
                "status": "completed",
                "date": "2026-10-27T16:40:00Z",
                "reference": "OKD-C-98441",
                "isSampleData": True,
            },
        ]

    return {
        "transactions": transactions,
        "isSampleData": True,
        "label": "Sample data",
    }
