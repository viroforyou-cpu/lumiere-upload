# Pricing

All prices are in **Argentine pesos (ARS)**. No dollar figures anywhere.

## Currency rule

- The single currency is ARS. Store amounts as integers of pesos (no decimals).
- Never mix currencies; if a price changes, edit it here once — do not patch tickets.

## Service prices

Prices are set per service per gender line. List every billable service and its price:

| Service | Gender line | Price (ARS) |
|---|---|---|
| Example: Men's cut | Men | 12000 |
| Example: Women's cut | Women | 18000 |
| ... | ... | ... |

## Retail products

Products the salon sells are priced in ARS and recorded in `records/inventory/`:

| Product | Unit price (ARS) |
|---|---|
| Example: Shampoo 250ml | 8500 |
| ... | ... |

## Pricing rules

- Stylists and assistants earn commission on both services and product sales; the percentage
  is per-staff and set by the owner in `settlement/commission-rates.md`.
- Discounts, packages, and gift cards follow `policies.md`.
- Update prices here at the start of a new price run; old tickets are never rewritten.
