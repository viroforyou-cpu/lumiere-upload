# 03_service — record the work performed

One job: confirm which stylist and assistant performed the service. Run by the stylist and
assistant; the receptionist records the result.

## Inputs

- Working: `../02_consult/output/consult.md`
- Reference: `records/staff/` (staff id per role)
- Reference: `records/clients/<id>/` (sensitivities to respect)

## Process

1. Read the consult file.
2. Confirm the stylist id; confirm the assistant id if hair washing or support occurred
   (assistants mainly wash hair).
3. Note any change from the plan (service swapped, add-on) for checkout.
4. Append a line to each staff member's `service-log.md`.

## Outputs

- `service.md` → `output/`: stylist id, assistant id, services actually performed.

## Human check

Stylist confirms the assistant actually worked the service before the assistant is logged.
Services have no timing — only who did what matters here.
