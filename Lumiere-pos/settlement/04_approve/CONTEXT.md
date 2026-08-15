# 04_approve — approve and log payments

One job: owner/administrator approves the week's payouts and logs them as paid.

## Inputs

- Working: `../03_payslips/output/`
- Reference: `../commission-rates.md`

## Process

1. Read all generated payslips.
2. Owner/administrator marks each `pending → approved`.
3. Log the payment (date, total ARS, method) in a `paid-log.md`.
4. Set payslips `approved → paid`.

## Outputs

- `paid-log.md` → `output/`: week, staff, amount ARS, paid date, method.

## Human check

The owner (or administrator) explicitly approves before anything is marked paid. A staff
member may confirm their own payslip only; receptionists have no access to this folder.
