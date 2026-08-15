```yaml
type: analytics
metric: new-clients-per-week
period: week
dimensions: [week]
filters: {}   # derived: client.first-visit-date falls in this week
```

## Metric

- **Metric:** count of new clients entering the salon, per operating week (Mon–Sat).
- **Source:** `records/clients/*/first-visit-date` (new = first visit ever).
- **Computation:** count each client's first-visit date grouped by ISO week.
- **Output:** `output/new-clients-per-week.md` → surfaced on `dashboards/01-week.md`.
