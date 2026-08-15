# _shared — the factory

Stable reference material used across the whole workspace. Everything here is configured once
at setup and changes rarely. Per-run artifacts never live here.

| File | What it defines |
|---|---|
| `operating-hours.md` | Opening hours and closed days |
| `service-menu.md` | Services for men and women (hair / nail / beauty) |
| `pricing.md` | Service and retail prices, all in ARS |
| `roles.md` | Roles, duties, and who has full access |
| `payment-methods.md` | Accepted payment types |
| `policies.md` | Refund, no-show, loyalty, tips, local data |
| `data-model.md` | Canonical field names and file shapes |
| `design-system.md` | Dashboard look: dark background, gold accent |
| `i18n/en.md`, `i18n/es.md` | UI label dictionaries (English / Spanish) |

## Rules for editors

- Edit the factory once; every run reads from here. Do not restate it in stage contracts —
  point to it instead.
- The owner (or administrator) is the only role that edits factory files.
- Prices are always Argentine pesos (ARS). Never store dollar figures.
