# 04_checkout — build the itemized bill

One job: turn the performed work into a priced bill, including retail products. Run by the
receptionist.

## Inputs

- Working: `../03_service/output/service.md`
- Reference: `_shared/pricing.md` (current ARS prices)
- Reference: `records/inventory/` (stock and unit prices for products)

## Process

1. Read the service file.
2. Price every service line from `pricing.md` (ARS).
3. Add retail product lines; deduct sold units from stock in `records/inventory/`.
4. Apply discounts, packages, or gift-card balances per `_shared/policies.md`.
5. Compute the total in ARS.

## Outputs

- `checkout.md` → `output/`: itemized lines, discounts, total ARS.

## Human check

Receptionist confirms every line and the total with the client before taking payment. Prices
come from `pricing.md`, never from memory.
