# analytics — the analytics engine

One job: turn records into metrics. Definitions live here; results land in `output/`.
Owner/admin tier only.

## How it works

1. A definition file (`.md` with YAML frontmatter) describes one metric: what to count, over
   which period, broken down by which dimensions, filtered by which conditions.
2. The engine reads records from `records/sales/`, `records/clients/`, `records/inventory/`
   according to each definition's source.
3. Results are written to `output/<metric>-<period>.md`.
4. Results feed the dashboards: today results → `dashboards/00-today.md` (receptionist),
   week/month results → `dashboards/01-week.md` and `02-month.md` (owner/admin).

## Any new metric

The owner or administrator can generate any kind of new analytics:

1. Copy `_templates/analytics-query.md` into `definitions/<metric-name>.md`.
2. Fill frontmatter: `metric`, `period`, `dimensions`, `filters`, `window`.
3. Describe the metric, its source records, and how it is computed.
4. Run the engine; the result appears in `output/` and can be surfaced on a dashboard.

## Rules

- One metric per file. Files are queryable via frontmatter.
- Receptionists never read `output/` directly; they see only the today dashboard.
- Results are regenerated, never hand-edited. Generated indexes are rebuilt by script.

## Definitions here

- `new-clients-per-day.md` — new clients entering per day
- `new-clients-per-week.md` — per week
- `new-clients-per-month.md` — per month
- `new-clients-per-stylist.md` — per stylist
- `returning-per-day.md` — returning clients per day
- `returning-per-week.md` — per week
- `returning-per-month.md` — per month
- `returning-per-stylist.md` — per stylist
- `returning-after-1-2-months.md` — % of returning clients after 1 and 2 months
