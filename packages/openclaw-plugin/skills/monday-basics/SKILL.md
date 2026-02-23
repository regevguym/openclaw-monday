---
name: monday-basics
description: Core concepts and entity model for monday.com — the foundational knowledge needed to understand how workspaces, boards, groups, items, and other entities are structured and related.
version: 1.0.0
---

# monday.com Core Concepts & Entity Model

## What is monday.com?

monday.com is a cloud-based work management platform that lets teams plan, track, and manage work using customizable boards, automations, and integrations. Everything in monday.com revolves around a visual, table-like interface where rows represent work items and columns represent the data fields attached to them.

## Entity Hierarchy

The entire monday.com data model follows a strict hierarchy:

```
Account
 └── Workspace
      └── Board
           └── Group
                └── Item
                     ├── Subitem
                     ├── Update (comment thread)
                     └── Column Values
```

Every entity has a unique numeric ID. IDs are globally unique within an account and are the primary way to reference entities in the API.

## Entities in Detail

### Account

The top-level container. An account represents one monday.com organization (company or team). All users, workspaces, boards, and data live under a single account.

Key properties:
- `id` — unique account identifier
- `slug` — the subdomain (e.g., `mycompany.monday.com`)
- `plan` — the subscription tier (Free, Basic, Standard, Pro, Enterprise)
- `tier` — similar to plan, used in API contexts

### Users

People who belong to the account. Each user has a role and can be assigned to items.

Key properties:
- `id` — unique user identifier
- `name` — display name
- `email` — login email
- `is_admin` — whether the user has admin privileges
- `is_guest` — whether the user is an external guest
- `teams` — list of teams the user belongs to

### Workspace

A container for organizing boards by department, project area, or any logical grouping. Workspaces provide access control — you can control which users see which workspaces.

Key properties:
- `id` — unique workspace identifier
- `name` — display name
- `kind` — `open` (all team members can access) or `closed` (invite-only)
- `description` — optional text description

When to use: Use workspaces to separate major organizational divisions (e.g., "Engineering", "Marketing", "Client Projects"). Every board belongs to exactly one workspace (or the "Main" default workspace).

### Board

The primary working surface. A board is a table where rows are items and columns are data fields. Boards are the most important entity in monday.com — nearly all user interaction happens at the board level.

Key properties:
- `id` — unique board identifier
- `name` — display name
- `board_kind` — type of board (see Board Types below)
- `state` — `active`, `archived`, or `deleted`
- `workspace_id` — the parent workspace
- `columns` — the column definitions for this board
- `groups` — the groups within this board
- `owner` — the user who created the board
- `permissions` — access level (`everyone` or `owners`)

#### Board Types

| Type | `board_kind` value | Description |
|------|-------------------|-------------|
| Main | `public` | Visible to all workspace members. The default type. |
| Private | `private` | Only visible to explicitly invited users. |
| Shareable | `share` | Can be shared with external guests outside the account. |

#### Board Views

Boards can be displayed in multiple views. Each view shows the same data in a different visual format:

- **Table View** — the default spreadsheet-like grid
- **Kanban View** — cards grouped by a status or label column
- **Timeline View** (Gantt) — items plotted on a horizontal time axis
- **Calendar View** — items placed on a calendar by date column
- **Chart View** — aggregated data visualized as bar, pie, or line charts
- **Map View** — items with location columns shown on a map
- **Cards View** — items displayed as visual cards
- **Form View** — a submission form that creates new items
- **Workload View** — resource allocation across people and time
- **Dashboard** — technically a separate entity, combining widgets from multiple boards

### Group

A section within a board that clusters related items together. Groups are displayed as colored, collapsible sections in the table view.

Key properties:
- `id` — unique identifier (a string like `"new_group"` or `"topics"`, not numeric)
- `title` — display name
- `color` — the group's color indicator
- `position` — display order within the board

When to use: Groups organize items within a board by phase, category, priority, or any logical division. Common patterns include grouping by status ("To Do", "In Progress", "Done"), by sprint, or by team.

### Item

The fundamental unit of work. An item is a single row in a board, representing a task, project, deal, request, or any trackable thing.

Key properties:
- `id` — unique item identifier
- `name` — the item's display name (the leftmost column)
- `group` — the group this item belongs to
- `board` — the board this item lives on
- `column_values` — the data stored in each column for this item
- `state` — `active` or `archived`
- `created_at` — creation timestamp
- `updated_at` — last modification timestamp
- `creator` — the user who created the item
- `subscribers` — users following this item for updates

Historical note: Items were originally called "pulses" in the monday.com API. Some legacy documentation and API fields may still reference this term.

### Subitem

A child item nested under a parent item. Subitems have their own board (auto-generated) with their own columns. They are useful for breaking down work into smaller tasks.

Key properties:
- Same structure as items, but linked to a parent item
- Each parent board has one shared subitems board
- Subitems have independent column definitions from their parent board

### Update

A comment or note attached to an item. Updates form a threaded conversation on each item, similar to a chat or forum thread.

Key properties:
- `id` — unique update identifier
- `body` — the content (supports HTML formatting)
- `text_body` — plain text version
- `creator` — the user who wrote it
- `replies` — nested reply updates
- `created_at` — timestamp

### Column

A field definition on a board. Columns define what data can be stored on each item. See the `monday-items` skill for detailed column type documentation.

Key properties:
- `id` — unique column identifier within the board (a string like `"status"`, `"date4"`, `"text_1"`)
- `title` — display name
- `type` — the column type (e.g., `status`, `text`, `numbers`, `date`)
- `settings_str` — JSON string containing column-specific configuration

## Key Terminology

| monday.com Term | Equivalent Concept | Notes |
|----------------|-------------------|-------|
| Board | Table / Spreadsheet | The primary data container |
| Item | Row / Record | A single work entry |
| Pulse | Item (legacy) | Deprecated term, still appears in some APIs |
| Column | Field / Property | Defines data structure |
| Group | Section / Category | Clusters items within a board |
| Update | Comment / Note | Threaded discussion on an item |
| Workspace | Folder / Department | Top-level organizational unit |

## Navigation Patterns

To locate any entity, follow the hierarchy using IDs:

1. **Find a board** — query boards by workspace, name, or ID
2. **Find groups in a board** — query the board's `groups` field
3. **Find items** — query `items_page` on a board, optionally filtering by group or column values
4. **Find subitems** — query the `subitems` field on an item
5. **Read column values** — query `column_values` on an item

All relationships are parent-to-child. There are no cross-board item references in the core model (though link columns and mirror columns can create virtual references).

## Organizational Design Guidelines

| Organizational Question | Recommended Entity |
|------------------------|-------------------|
| Separate departments or teams | Workspaces |
| Separate projects, processes, or datasets | Boards |
| Separate phases, categories, or statuses within a project | Groups |
| Separate individual tasks or records | Items |
| Break down a task into subtasks | Subitems |
| Add discussion or context to a task | Updates |

### Common Anti-Patterns to Avoid

- **One mega-board for everything** — leads to performance issues and confusion. Split into multiple boards.
- **Using groups as boards** — if groups have different column needs, they should be separate boards.
- **Deeply nested subitems** — monday.com only supports one level of subitems. For deeper hierarchy, use linked boards.
- **Ignoring workspaces** — workspace access control is the primary security boundary. Use them.
