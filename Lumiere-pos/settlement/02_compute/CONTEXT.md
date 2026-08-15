# 02_compute — apply commission rates

One job: compute each staff member's commission for the week.

## Inputs

- Working: `../01_collect/output/tickets-collected.md`
- Reference: `../commission-rates.md` (per-staff percentages)

## Process

1. Read the collected tickets.
2. For each staff member, sum services total and products total from their tickets.
3. Apply that member's percentages from `commission-rates.md`.
4. Produce a commission summary per member (services, products, total ARS).

## Outputs

- `commissions.md` → `output/`: per-member totals and commission amounts, in ARS.

## Human check

Owner/administrator scans the numbers against known sales before payslips are generated.
This folder is never shown to receptionists.
