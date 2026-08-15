```yaml
type: analytics
metric: new-clients-per-day
period: day
dimensions: [date]
filters: {}   # derived: client.first-visit-date falls in this day
```

## Metric

- **Metric:** count of new clients entering the salon, per day.
- **Source:** `records/clients/*/first-visit-date` (new = first visit ever); first ticket in
  `records/sales/<YYYY-WNN>/` for stylist attribution.
- **Computation:** a client is new on their first visit; count each client's first-visit date
  grouped by day. On a per-stylist view, attribute the new client to the stylist on that
  first ticket.
- **Output:** `output/new-clients-per-day.md` → surfaced on `dashboards/00-today.md`.
