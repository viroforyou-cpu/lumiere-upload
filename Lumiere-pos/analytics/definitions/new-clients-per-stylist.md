```yaml
type: analytics
metric: new-clients-per-stylist
period: custom
dimensions: [stylist_id, date]
filters: {}   # derived: client.first-visit-date in window, attributed to that ticket's stylist
```

## Metric

- **Metric:** count of new clients entering the salon, attributed to each stylist.
- **Source:** `records/clients/*/first-visit-date` and `records/sales/<YYYY-WNN>/ticket-*.md`
  (a client's first ticket carries the stylist id).
- **Computation:** for each client's first visit, attribute them to the stylist on that
  ticket; count per stylist. Optionally split day/week/month by period.
- **Output:** `output/new-clients-per-stylist.md` → surfaced on `dashboards/01-week.md`
  (staff performance view).
