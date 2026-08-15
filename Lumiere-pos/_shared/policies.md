# Policies

## Tips — personal and off-system

- Tips are received **personally** by the staff member (stylist or assistant).
- Tips are **never recorded** in tickets, records, or reports. There is no tip field in the
  data model. The salon does not track, tax, or split tips in this system.

## Refunds

- Refunds are recorded as a new negative line or a return ticket; the original ticket is never
  edited. Owner/administrator approval required.

## No-shows and cancellations

- Appointments are slots only (no service timing). A no-show is marked at `01_check-in`.
- No-show counts feed daily/weekly/monthly analytics.

## Loyalty and gift cards

- Loyalty and gift-card balances live in `records/clients/<id>/` (see data model).
- Gift-card redemptions are recorded as a payment method at checkout.

## Data — local first

- All business data is saved locally in this workspace as markdown/JSON files.
- No cloud sync, no external database, no third-party service required.

## Language

- The dashboard UI is bilingual: English and Spanish, labels drawn from `_shared/i18n/`.
