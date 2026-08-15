# 03_payslips — emit weekly payslips

One job: create one payslip per stylist and assistant.

## Inputs

- Working: `../02_compute/output/commissions.md`
- Reference: `../commission-rates.md`
- Reference: `../../_templates/payslip.md` (shape)

## Process

1. Read the computed commissions.
2. For each member, copy `payslip.md` to `output/<role>-<id>-<name>-<YYYY-WNN>.md`.
3. Fill in category amounts, percentages, and total commission ARS.

## Outputs

- One payslip per stylist/assistant → `output/`.

## Human check

Owner/administrator reviews each payslip line against the commissions summary.
A staff member may see only their own payslip at approval; receptionists see none.
