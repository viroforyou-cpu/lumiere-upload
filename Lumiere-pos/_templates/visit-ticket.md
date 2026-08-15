# Visit Ticket Template

Copy this file to `records/sales/<YYYY-WNN>/ticket-<YYYY-MM-DD>-<seq>.md` when `05_payment`
completes. One ticket per client visit.

```yaml
type: ticket
date: 2026-08-14
seq: "001"
client_id: "0001"
stylist_id: stylist-001-amara
assistant_id: assistant-001-lena
is_returning: true
status: paid
```

## Body — itemized lines

Each line is a service or retail product:

| Type | Item | Qty | Unit ARS | Subtotal ARS |
|---|---|---|---|---|
| service | womens-cut | 1 | 18000 | 18000 |
| product | shampoo-250ml | 1 | 8500 | 8500 |

## Body — payment lines

Per `_shared/payment-methods.md`, one line per method:

| Method | Amount ARS |
|---|---|
| cash | 15000 |
| card | 11500 |

## Body — totals

- Subtotal, discounts, **Total ARS**, payment split.

## Rules

- **No commission fields** — commission is computed only in `settlement/`.
- **No tip fields** — tips are personal and off-system.
- **No duration fields** — services have no timing.
- Never edit a signed ticket; corrections are new lines or return tickets (see `policies.md`).
