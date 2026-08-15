# Staff Record Template

Copy this file to `records/staff/<role>-<id>-<name>/info.md` plus the folder's log files.

```yaml
type: staff
role: stylist
shift: ""                 # morning | afternoon for receptionists; empty otherwise
status: active
```

## info.md

- Full name
- Role: `owner | administrator | stylist | assistant | receptionist`
- Shift (receptionists only): morning or afternoon
- Contact / emergency
- Joined date

## service-log.md (stylists and assistants)

One line per service performed:

```yaml
- date: 2026-08-14
  ticket: ticket-2026-08-14-001
  service: womens-cut
  role_on_service: stylist    # stylist | assistant
```

## shift-log.md (receptionists only)

One line per working day:

```yaml
- date: 2026-08-14
  shift: morning
  opened: "08:00"
  closed: "15:00"
```

## Rules

- Commission rates are **not** stored in this record — they live in
  `settlement/commission-rates.md` (owner/admin tier).
- A receptionist may never read or write `settlement/`.
