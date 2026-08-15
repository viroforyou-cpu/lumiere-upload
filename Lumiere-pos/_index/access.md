# Access Map

Who may read and write what. Access is enforced structurally: commission data exists only in
the owner/admin tier folder, so receptionists literally cannot reach it.

## Tiers

- **Full** — owner, administrator. Everything.
- **Staff** — stylists, assistants. Daily operation; see only their own service log.
- **Receptionist** — daily operation; today dashboard only.

## Matrix

| Area | Full (owner/admin) | Receptionist | Stylist/Assistant |
|---|---|---|---|
| `stages/` (visit pipeline) | read/write | read/write | read service notes |
| `records/clients/` | read/write | read/write | read |
| `records/staff/` | read/write | read/write (their own log) | read own |
| `records/inventory/` | read/write | read/write | read |
| `records/sales/` | read/write | read/write (create tickets) | read own tickets |
| `dashboards/00-today.md` | read/write | read | read |
| `dashboards/01-week.md`, `02-month.md` | read | **no** | no |
| `analytics/definitions/` | read/write | no | no |
| `analytics/output/` | read | **no** | no |
| `settlement/` (all) | read/write | **no** | **no** |
| `settlement/commission-rates.md` | read/write | **no** | **no** |
| `settlement/03_payslips/` | read/write | **no** | read own payslip only |
| `_shared/` (factory) | read/write | read | read |
| `_templates/`, `_index/`, `setup/` | read/write | read | read |
| `reports/` | read | read daily | read daily |

## Commission confidentiality

- Commission rates and earned commission exist **only** under `settlement/`.
- Tickets in `records/sales/` never contain commission fields.
- Receptionists have no path into `settlement/` — not by role, not by navigation, not by link.
- Only the owner and the administrator see commission earnings of stylists and assistants.
