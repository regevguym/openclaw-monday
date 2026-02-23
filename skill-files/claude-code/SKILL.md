---
name: monday-com
description: monday.com knowledge for Claude Code - entity model, API, column formats, workflows
version: "0.1.0"
---

# monday.com for Claude Code

Standalone skill file for Claude Code. Install by copying to `~/.claude/skills/monday-com/SKILL.md`.
Requires the monday.com MCP server configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "monday": {
      "type": "streamable-http",
      "url": "https://mcp.monday.com/mcp",
      "headers": { "Authorization": "Bearer ${MONDAY_API_TOKEN}" }
    }
  }
}
```

## Entity Hierarchy

```
Account → Workspaces → Boards → Groups → Items → Column Values / Updates / Subitems
```

- **Board** = database table. Columns define schema, items are rows.
- **Groups** = visual sections (e.g., "To Do", "In Progress", "Done").
- **Items** = primary records. Each has a name + column values.
- **Updates** = threaded comments on items.

## API Basics

- **Endpoint:** `https://api.monday.com/v2` (POST, GraphQL)
- **Auth:** `Authorization: <TOKEN>` header
- **Version:** `API-Version: 2024-10`
- **Rate limit:** 5M complexity points/min. Request only needed fields.
- **Pagination:** Cursor-based for items (`items_page` → `next_items_page`).

## Column Value Formats

Pass as JSON in `column_values` parameter:

| Type | Format | Example |
|---|---|---|
| Status | `{ "label": "Done" }` | `{ "label": "Working on it" }` |
| Text | `"value"` | `"Hello"` |
| Numbers | `42` | `100.5` |
| Date | `{ "date": "YYYY-MM-DD" }` | `{ "date": "2024-03-15" }` |
| Timeline | `{ "from": "...", "to": "..." }` | `{ "from": "2024-01-01", "to": "2024-01-31" }` |
| People | `{ "personsAndTeams": [{ "id": N, "kind": "person" }] }` | - |
| Dropdown | `{ "labels": ["Option"] }` | `{ "labels": ["High", "Urgent"] }` |
| Checkbox | `{ "checked": "true" }` | `{ "checked": "true" }` |
| Email | `{ "email": "...", "text": "..." }` | `{ "email": "a@b.com", "text": "Email" }` |
| Phone | `{ "phone": "...", "countryShortName": "US" }` | - |
| Link | `{ "url": "...", "text": "..." }` | `{ "url": "https://x.com", "text": "Link" }` |
| Long Text | `{ "text": "..." }` | `{ "text": "Description here" }` |
| Rating | `{ "rating": N }` | `{ "rating": 4 }` |
| Location | `{ "lat": N, "lng": N, "address": "..." }` | - |
| Country | `{ "countryCode": "US", "countryName": "United States" }` | - |

Use `create_labels_if_missing: true` for new status/dropdown labels.

## Best Practices

1. **Get board structure first** (`boards(ids:)`) before modifying items.
2. **Use variables** in GraphQL — never string interpolation.
3. **Batch column updates** via `change_multiple_column_values`.
4. **Paginate** large item lists with cursor.
5. **Search before creating** to avoid duplicates.
