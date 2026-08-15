# Lumiere-pos

Point-of-service workspace for Lumiere, a beauty / hair / nail salon serving men and women.
Local-first: all business data lives in this folder as markdown files. All prices are in
Argentine pesos (ARS). The dashboard UI is bilingual (English / Spanish).

## Where everything lives

| Task | Go to |
|---|---|
| Daily salon operation (check-in → payment) | `stages/` |
| Client, staff, inventory, sales records | `records/` |
| Define or run an analytics metric | `analytics/` |
| Weekly commission payout (owner/admin only) | `settlement/` |
| Read the live dashboard (today / week / month) | `dashboards/` |
| Stable rules: hours, menu, pricing, roles, policies | `_shared/` |
| Blank records and contracts | `_templates/` |
| Who may read/write what | `_index/access.md` |
| One-time salon setup | `setup/questionnaire.md` |

## Access

Full access (owner + administrator): everything including `settlement/` and `analytics/output/`.
Receptionists: daily operation only (`stages/`, `dashboards/00-today.md`). They never see
`settlement/`, commission rates, or commission earnings. See `_index/access.md`.

## Reading the workspace

Each working folder has a `CONTEXT.md` contract: inputs, process, outputs, human check.
Read that folder's contract, its inputs, and only the references it names. Do not load the
whole workspace.
