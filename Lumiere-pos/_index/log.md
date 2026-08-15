# Index Log — catalog of records

Catalog: one line per record, id + status. This is the declared source of truth for what
exists. Status lifecycle: `briefed → active → archived`.

## Clients

| Id | Slug | First visit | Status |
|---|---|---|---|
| _empty_ | | | |

## Staff

| Id | Role | Shift | Status |
|---|---|---|---|
| _empty_ | | | |

## Inventory

| Id | Product | Unit ARS | Status |
|---|---|---|---|
| _empty_ | | | |

## Rules

- Add a line when a record is created (always from a `_templates/` copy); update status when
  it changes. Every line here must correspond to a real folder under `records/`.
- This file is a catalog — it points at records, it never holds record content.
- A generated version can be rebuilt from frontmatter by script; never hand-maintain a second
  copy of the data here.
