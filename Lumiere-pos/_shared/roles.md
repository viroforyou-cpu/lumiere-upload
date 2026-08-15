# Roles

## Role table

| Role | Full access | Daily operation | Commission visibility | Pay |
|---|---|---|---|---|
| Owner | Yes | Can override anything | Yes | n/a (profit) |
| Administrator | Yes | Can override anything | Yes | n/a (fixed or owner-decided) |
| Stylist | No | Performs services | Sees own, not others' | Commission, weekly |
| Assistant | No | Washes hair, supports stylists | Sees own, not others' | Commission, weekly |
| Receptionist | No | Runs the salon day-to-day | **Never** | Fixed salary |

## Full-access roles

- **Owner** — edits the factory, sets commission rates, approves payouts, generates analytics.
- **Administrator** — has complete access exactly like the owner (settlement, analytics output,
  factory edits, staff and client records). Appointed by the owner.

Both owner and administrator can view `settlement/`, `settlement/commission-rates.md`, and
`analytics/output/`.

## Receptionists (run the salon daily)

- Two receptionists: **one morning** (opens at 08:00), **one afternoon** (closes at 21:00).
- They run `stages/` for every client visit and keep `dashboards/00-today.md` current.
- They **do not have access** to commission earned by stylists or assistants. This is enforced
  structurally: commission data exists only under `settlement/`, which is not in their reach.

## Staff records

Every staff member has a folder in `records/staff/<role>-<id>-<name>/`. Role and shift are
tagged in the record frontmatter (see `_templates/record-staff.md`).
