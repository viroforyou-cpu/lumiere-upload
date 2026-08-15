# Client Record Template

Copy this folder/file to `records/clients/<id>-<slug>/`. The copy is the stamp — do not
create a client from a blank page.

```yaml
type: client
id: "0001"
slug: jane-doe
first-visit-date: 2026-07-10
gender_line: women
status: active
```

## info.md

- Full name
- Phone / preferred contact
- Notes (allergies, sensitivities, anything the stylist must know)

## preferences.md

- Preferred stylist / assistant
- Favorite services and products
- Communication preference

## visits/

One file per visit: `visit-<YYYY-MM-DD>.md`. Each holds a pointer to the signed ticket in
`records/sales/` and any follow-up note. Visit files feed new-vs-returning analytics.

## loyalty.md

- Gift-card balances (ARS)
- Loyalty points / rewards status

## Rules

- Never store tips here (off-system). Never store prices from a past date; prices live in
  `_shared/pricing.md`.
