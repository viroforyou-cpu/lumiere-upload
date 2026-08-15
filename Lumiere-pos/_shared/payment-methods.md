# Payment Methods

Accepted payment types at checkout (`stages/05_payment`). All amounts in ARS.

| Method | Notes |
|---|---|
| Cash | Pesos only; change calculated and recorded |
| Card (credit/debit) | Record card type; amount in ARS |
| Mobile payment | Local transfer / wallet apps |
| Gift card | Redeem balance; tracks gift-card ledger |
| Voucher / promo | Discount codes or salon vouchers |

## Rules

- A single ticket may use **multiple** payment methods (e.g., cash + gift card balance).
- The payment log records, per ticket: method, amount in ARS, and reference (if any).
- Tips are **not** processed here — tips are received personally by the staff member and are
  off-system (see `policies.md`).
- Payment method list is defined here once; do not invent new methods inline in tickets.
