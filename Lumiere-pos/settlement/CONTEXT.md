# settlement — weekly commission payout

One job: compute and pay weekly commissions for stylists and assistants. Owner/admin tier only.
Runs every Saturday close.

```
01_collect → 02_compute → 03_payslips → 04_approve
```

## Inputs

- Working: week's tickets from `records/sales/`
- Reference: `commission-rates.md` (per-staff percentages)

## Rules

- Stylists and assistants are on commission, paid **at the end of the week** (Saturday close).
- The percentage is **variable per staff member** and per category (services vs products), and
  is decided by the owner (or administrator).
- Commission applies to both services and retail product sales.
- A receptionist must never see anything in this folder. Access is structural: `settlement/`
  is not reachable by the receptionist role.

## Sub-stages

- `01_collect/` — gather the week's tickets.
- `02_compute/` — apply each staff member's commission rates.
- `03_payslips/` — emit one payslip per stylist/assistant.
- `04_approve/` — owner/administrator approves; log as paid.
