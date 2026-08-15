# Design System — Dashboard

Target: professional, modern, and easy to understand for receptionists who are not technical.

## Visual identity

- **Background:** dark (near-black, e.g. `#121212`).
- **Accent:** gold (e.g. `#C9A227` / `#E8C868`).
- Text on dark: warm white / light gray for body, gold for headings and key numbers.
- Professional, high-contrast, generous whitespace, large readable numbers.

## Layout principles

- Receptionists see **one screen** (`dashboards/00-today.md`): plain metric cards, no jargon.
- Big numbers first (tickets, revenue in ARS, products sold), secondary numbers below.
- Every metric label is pulled from `_shared/i18n/` (English and Spanish shown together or
  toggleable) — never hard-coded English strings.
- Graphs are kept simple: daily bar/line summaries; no dense tables on the receptionist screen.
- Week and month dashboards are for owner/administrator; they may include staff performance,
  segments, retention, and trend views.

## Tone

- Plain language. Avoid technical terms on receptionist screens (e.g. "revenue" is shown with
  a friendly label like "Ventas del día / Today's sales").
