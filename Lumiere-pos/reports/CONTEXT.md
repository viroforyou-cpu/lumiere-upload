# reports — daily / weekly / monthly rollups

Generated rollups from tickets and analytics results.

| Folder | Produces | Feeds |
|---|---|---|
| `daily/output/` | Day-end rollup (tickets, revenue ARS, payments, products) | `dashboards/00-today.md`, weekly handoff |
| `weekly/output/` | Week rollup (Mon–Sat) | `dashboards/01-week.md` |
| `monthly/output/` | Month rollup | `dashboards/02-month.md`, trends |

## Rules

- Rollups are generated, never hand-edited for numbers.
- All amounts in ARS. No commission and no tip data appear in reports.
- Receptionists may read `daily/`; `weekly/` and `monthly/` are owner/admin.
