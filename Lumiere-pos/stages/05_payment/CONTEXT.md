# 05_payment — take payment and sign the ticket

One job: collect payment, produce the receipt, and file the signed ticket. Run by the
receptionist.

## Inputs

- Working: `../04_checkout/output/checkout.md`
- Reference: `_shared/payment-methods.md`
- Reference: `records/clients/<id>/loyalty.md` (gift-card balance)

## Process

1. Read the checkout file.
2. Record payment split across one or more methods from `payment-methods.md` (all ARS).
3. Apply gift-card redemptions and update the client's loyalty balance.
4. Write the signed ticket to `records/sales/<YYYY-WNN>/ticket-<date>-<seq>.md` using the
   `_templates/visit-ticket.md` shape — including stylist/assistant ids.
5. Append a visit line to `records/clients/<id>/visits/`.

## Outputs

- Signed ticket → `records/sales/<YYYY-WNN>/` (the pipeline's final artifact).

## Human check

Receptionist hands the client the receipt and confirms payment cleared. The ticket is then
final — corrections are new lines or return tickets, never edits. Tips are personal and
off-system; they are never recorded here. Commission is never computed here.

The today dashboard is rebuilt from records by the analytics engine — this stage does not
hand-edit `dashboards/00-today.md`.
