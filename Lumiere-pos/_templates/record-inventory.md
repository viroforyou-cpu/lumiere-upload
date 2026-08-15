# Inventory Record Template

Copy this file to `records/inventory/product-<id>-<slug>/stock.md` plus the folder's files.

```yaml
type: product
id: "001"
sku: lumiere-001
name: Shampoo 250ml
unit_price_ars: 8500
status: active
```

## stock.md

| Date | In | Out | Balance |
|---|---|---|---|
| 2026-08-01 | 24 | 0 | 24 |

`Out` lines reference the ticket that sold them.

## reorder.md

- Reorder point (units)
- Reorder history: date, quantity ordered, supplier, expected arrival

## Rules

- All prices in ARS (`unit_price_ars`). Retail sales at checkout deduct from stock here.
- Product commissions are computed only in `settlement/`, never here.
