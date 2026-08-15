# Lumiere-pos — Workspace Map

Three structures compose here:

1. **Record library** (`records/`) — clients, staff, inventory, and sales tickets accumulate.
2. **Visit pipeline** (`stages/`) — one client visit runs `01_check-in → 05_payment` daily.
3. **Settlement pipeline** (`settlement/`) — weekly commission payout, owner/admin only.

Analytics (`analytics/`) reads records and emits results. Dashboards (`dashboards/`) render
those results for humans. Reports (`reports/`) hold daily/weekly/monthly rollups.

```
records/  ──►  analytics/  ──►  dashboards/
   ▲                  │
   │                  ▼
stages/ ──► sales ──► reports/ ──► settlement/ (weekly, owner/admin)
```

## The repeating units

- **A client visit** = a run of `stages/`; each run ends in a signed ticket in `records/sales/`.
- **A week** = Mon–Sat operating run; settlement happens at Saturday close.
- **A month** = reporting and trend cycle.

## Key rules

- All prices in **ARS**. No service timing/durations. Tips are personal and off-system.
- Commission: variable per staff member, set by owner/admin in `settlement/commission-rates.md`.
- New vs returning clients is flagged at `01_check-in`; per-stylist attribution comes from the
  ticket's stylist id.
- One human check per stage. Nothing moves forward until a person read the last output.

See `_index/access.md` for who reads what.
