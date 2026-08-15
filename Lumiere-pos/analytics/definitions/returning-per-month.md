```yaml
type: analytics
metric: returning-per-month
period: month
dimensions: [month]
filters: { is_returning: true }
```

## Metric

- **Metric:** count of returning clients entering the salon, per month.
- **Source:** `records/sales/<YYYY-WNN>/ticket-*.md`.
- **Computation:** count tickets with `is_returning: true` grouped by month.
- **Output:** `output/returning-per-month.md` → surfaced on `dashboards/02-month.md`.
