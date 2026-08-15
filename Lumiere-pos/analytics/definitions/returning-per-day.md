```yaml
type: analytics
metric: returning-per-day
period: day
dimensions: [date]
filters: { is_returning: true }
```

## Metric

- **Metric:** count of returning clients entering the salon, per day.
- **Source:** `records/sales/<YYYY-WNN>/ticket-*.md` (ticket flag `is_returning`).
- **Computation:** count tickets with `is_returning: true` grouped by date.
- **Output:** `output/returning-per-day.md` → surfaced on `dashboards/00-today.md`.
