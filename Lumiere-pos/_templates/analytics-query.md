# Analytics Query Template

Copy this file to `analytics/definitions/<metric-name>.md` to create any new analytics metric.
The owner or administrator decides what metrics exist. Results land in `analytics/output/`.

```yaml
type: analytics
metric: my-new-metric
period: day                # day | week | month | custom
dimensions: []             # e.g., [stylist, gender_line, payment_method]
filters: {}                # e.g., { is_returning: true }
window: ""                 # optional date range for custom periods
```

## Metric definition

- **Metric:** what is being counted or summed (tickets, revenue ARS, distinct clients, rate).
- **Dimensions:** how results are broken down (per stylist, per day, per gender line, ...).
- **Filters:** which records are included (new vs returning, payment method, service group).
- **Source:** which records feed it (`records/sales/`, `records/clients/`, `records/inventory/`).

## How to add a metric

1. Copy this template into `analytics/definitions/`.
2. Fill the frontmatter and the metric definition.
3. Run the analytics engine (see `analytics/CONTEXT.md`).
4. Result is written to `analytics/output/<metric>-<period>.md`, then surfaced on the relevant
   dashboard (`dashboards/00-today.md`, `01-week.md`, or `02-month.md`).

## Rules

- One metric per definition file. Queryable via frontmatter.
- Receptionists never read `analytics/output/` except through the today dashboard.
