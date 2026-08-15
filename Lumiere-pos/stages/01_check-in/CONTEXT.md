# 01_check-in — record the client's arrival

One job: capture who arrived and whether they are new or returning. Run by the receptionist
(morning or afternoon).

## Inputs

- Working: none
- Reference: `_shared/operating-hours.md` (salon open/closed, shift handover)
- Reference: `_index/log.md` (find existing client id)

## Process

1. Check the salon is open (Mon–Sat 08:00–21:00).
2. Find the client in `records/clients/` via `_index/log.md`; create a new client record from
   `_templates/record-client.md` if they have no `first-visit-date` yet.
3. Flag `is_returning` for the ticket (returning = a prior visit exists).
4. Mark no-shows for booked slots that never arrived.

## Outputs

- `check-in.md` → `output/`: client id, arrival time, new/returning flag.

## Human check

Receptionist confirms the name and phone on screen; correct the record if a typo before the
service starts.
