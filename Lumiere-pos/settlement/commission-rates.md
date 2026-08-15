# Commission Rates — per staff member

The commission percentage is **variable per stylist and assistant** and is decided by the
owner (or administrator). Edit this file directly; the compute stage reads it as-is.

All amounts are percentages of the ticket amount, in the two commissionable categories.
Fill these tables during setup — every row must match a real staff record in
`records/staff/` and `_index/log.md`.

## Stylists

| Staff id | Name | Service commission % | Product commission % |
|---|---|---|---|
| _empty_ | | | |

## Assistants

| Staff id | Name | Service commission % | Product commission % |
|---|---|---|---|
| _empty_ | | | |

## Rules

- Only the owner and the administrator edit or read this file.
- Percentages can differ between staff members and can change at any time; changes apply from
  the week they are saved.
- Tips are personal and off-system — they are never part of commission.
- Gift-card and voucher amounts are not commissionable unless the owner says otherwise here.
