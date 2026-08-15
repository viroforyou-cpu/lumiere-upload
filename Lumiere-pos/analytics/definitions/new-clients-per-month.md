```yaml
type: analytics
metric: new-clients-per-month
period: month
dimensions: [month]
filters: {}   # derived: client.first-visit-date falls in this month
```

## Metric

- **Metric:** count of new clients entering the salon, per month.
- **Source:** `records/clients/*/first-visit-date` (new = first visit ever).
- **Computation:** count each client's first-visit date grouped by month.
- **Output:** `output/new-clients-per-month.md` → surfaced on `dashboards/02-month.md`.
