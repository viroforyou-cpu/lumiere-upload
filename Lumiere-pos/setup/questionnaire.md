# Setup Questionnaire — configure Lumiere-pos once

Answer once at setup; the answers fill the factory (`_shared/`, `settlement/commission-rates.md`,
`setup/`). Owner/administrator only.

## Salon identity

1. Salon name shown on dashboards: **Lumiere**
2. Address and phone (used on receipts): ____

## Operating hours

3. Confirm hours: Mon–Sat 08:00–21:00, closed Sunday? (edit `_shared/operating-hours.md` if not)

## Currency

4. Currency is Argentine pesos (ARS). Confirm no dollar amounts will be entered.

## Staff

5. List stylists (name, service commission %, product commission %).
6. List assistants (name, service commission %, product commission %).
7. List receptionists and their shifts (morning / afternoon).
8. Name the administrator(s) who share full access with the owner.

## Services and pricing

9. Fill `_shared/service-menu.md` with the actual service list (hair / nail / beauty, men & women).
10. Fill `_shared/pricing.md` with current ARS prices for services and retail products.

## Payments

11. Confirm the accepted payment methods in `_shared/payment-methods.md`.

## Language

12. Confirm dashboards show both English and Spanish labels (from `_shared/i18n/`).

## Dashboard look

13. Confirm dark background + gold accent per `_shared/design-system.md`.

## Rules to confirm

14. Tips are personal and off-system (never recorded).
15. Services have no timing/duration.
16. All data is stored locally in this workspace.

After answering, the workspace is ready: records follow `_templates/`, analytics follow
`analytics/CONTEXT.md`, weekly payout follows `settlement/CONTEXT.md`.
