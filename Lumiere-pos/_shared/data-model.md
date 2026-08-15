# Data Model

Canonical field names and file shapes. Every record and ticket follows this exactly. If the
schema and the files ever disagree, update the schema or the files — pick one.

## Conventions

- All files: markdown with YAML frontmatter. Machine-facing slugs are kebab-case.
- Currency: **ARS**, integer pesos. Never dollars, never decimals.
- Dates: `YYYY-MM-DD`. Week buckets: `YYYY-WNN` (ISO label; operating week runs Mon–Sat and
  Sunday has no tickets). Times: `HH:MM` 24h.
- Status lifecycle (records): `briefed → active → archived`. Statuses live in `_index/log.md`.

## Client record (`records/clients/<id>-<slug>/`)

```yaml
type: client
id: "0001"
slug: jane-doe
first-visit-date: 2026-07-10
gender_line: women      # men | women
status: active
```

Files: `info.md` (contact), `preferences.md`, `visits/` (one file per visit), `loyalty.md`
(balances, gift cards). New vs returning is derived from `first-visit-date` vs visit history.

## Staff record (`records/staff/<role>-<id>-<name>/`)

```yaml
type: staff
role: stylist            # owner | administrator | stylist | assistant | receptionist
shift: day               # morning | afternoon | (empty for stylists/assistants)
status: active
```

Files: `info.md`, `service-log.md` (services performed), `shift-log.md` (receptionists only).
Commission rates are **not** stored here — they live in `settlement/commission-rates.md`.

## Inventory record (`records/inventory/product-<id>-<slug>/`)

```yaml
type: product
id: "001"
sku: lumiere-001
unit_price_ars: 8500
```

Files: `stock.md`, `reorder.md` (reorder point and history).

## Sales ticket (`records/sales/<YYYY-WNN>/ticket-<YYYY-MM-DD>-<seq>.md`)

Signed tickets are bucketed by operating week (Mon–Sat) under `records/sales/<YYYY-WNN>/`.
The ISO week label is used for the bucket; Sunday has no tickets.

```yaml
type: ticket
date: 2026-08-14
seq: "001"
client_id: "0001"
stylist_id: stylist-001-amara
assistant_id: assistant-001-lena   # empty if none
is_returning: true
status: paid
```

Body: itemized lines (service or product, quantity, unit ARS, subtotal), payment lines per
`payment-methods.md`, totals. **No commission fields. No tip fields.** Commission is computed
only in `settlement/`.

## Analytics definition (`analytics/definitions/<metric>.md`)

```yaml
type: analytics
metric: new-clients-per-day
period: day
dimensions: []          # e.g., [stylist, gender_line]
filters: {}
```

See `analytics/CONTEXT.md` for how definitions run and land in `analytics/output/`.

## Reports and dashboards

- `reports/{daily,weekly,monthly}/output/` hold generated rollups (frontmatter-tagged).
- `dashboards/00-today.md`, `01-week.md`, `02-month.md` are generated trackers that render
  labels from `_shared/i18n/` and never carry content payload themselves.
