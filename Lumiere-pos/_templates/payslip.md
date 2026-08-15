# Payslip Template

Copy this file to `settlement/03_payslips/output/<role>-<id>-<name>-<YYYY-WNN>.md` during
weekly settlement. Owner/admin tier only.

```yaml
type: payslip
week: 2026-W34
staff_id: stylist-001-amara
role: stylist
status: pending    # pending | approved | paid
```

## Body

| Category | Amount ARS | Commission % | Commission ARS |
|---|---|---|---|
| Services total | 120000 | 30% | 36000 |
| Products total | 25000 | 10% | 2500 |
| **Total commission** | | | **38500** |

## Rules

- Percentage comes from `settlement/commission-rates.md` (per staff, per category), set by the
  owner/administrator.
- Approved by owner/administrator in `04_approve` before anything is paid.
- A receptionist must never see this file.
