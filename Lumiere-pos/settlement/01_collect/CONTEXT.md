# 01_collect — gather the week's tickets

One job: assemble every signed ticket for the operating week (Mon–Sat).

## Inputs

- Working: `records/sales/` (week bucket `YYYY-WNN/`)
- Reference: `_shared/operating-hours.md` (week boundaries)

## Process

1. Identify the week bucket(s) for the current operating week.
2. Verify each ticket is `status: paid` and complete.
3. Split tickets by `stylist_id` and `assistant_id`.

## Outputs

- `tickets-collected.md` → `output/`: list of ticket paths grouped by staff member.

## Human check

Owner/administrator confirms no ticket is missing before computing.
