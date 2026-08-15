```yaml
type: analytics
metric: returning-after-1-2-months
period: month
dimensions: [cohort_month]
filters: {}
window: "last 6 months"
```

## Metric

- **Metric:** percentage of clients who return after 1 month and after 2 months, per entry
  cohort.
- **Source:** `records/clients/*/first-visit-date` and `records/clients/*/visits/`.
- **Computation:** for each cohort (clients who first visited in month M), compute
  - returning within 1 month = first visit after first-visit-date within 30 days,
  - returning within 2 months = within 60 days.
  Express as a percentage of the cohort.
- **Output:** `output/returning-after-1-2-months.md` → surfaced on `dashboards/02-month.md`
  (retention view).
