```yaml
type: analytics
metric: returning-per-week
period: week
dimensions: [week]
filters: { is_returning: true }
```

## Metric

- **Metric:** count of returning clients entering the salon, per operating week.
- **Source:** `records/sales/<YYYY-WNN>/ticket-*.md`.
- **Computation:** count tickets with `is_returning: true` grouped by week.
- **Output:** `output/returning-per-week.md` → surfaced on `dashboards/01-week.md`.
