```yaml
type: analytics
metric: returning-per-stylist
period: custom
dimensions: [stylist_id, date]
filters: { is_returning: true }
```

## Metric

- **Metric:** count of returning clients entering the salon, attributed to each stylist.
- **Source:** `records/sales/<YYYY-WNN>/ticket-*.md` (ticket carries the stylist id).
- **Computation:** count `is_returning: true` tickets per stylist. A returning visit is
  attributed to the stylist who served them. Optionally split day/week/month.
- **Output:** `output/returning-per-stylist.md` → surfaced on `dashboards/01-week.md`
  (staff performance view).
