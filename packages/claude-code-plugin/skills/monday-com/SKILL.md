---
name: monday-com
description: Comprehensive monday.com knowledge for AI agents - entity model, API patterns, column value formats, and workflow best practices
version: "0.1.0"
---

# monday.com Agent Knowledge

## Entity Model

monday.com organizes work in a hierarchy:

```
Account
└── Workspaces (organizational containers)
    └── Boards (like spreadsheets/tables)
        ├── Columns (field definitions - shared across all items)
        ├── Groups (row sections/categories)
        │   └── Items (rows/records)
        │       ├── Column Values (cell data)
        │       ├── Subitems (child items)
        │       └── Updates (comments/activity)
        └── Views (Table, Kanban, Timeline, Calendar, Chart, etc.)
```

**Key concepts:**
- A **Board** is like a database table. Columns define the schema, items are the rows.
- **Groups** are visual sections within a board (like "To Do", "In Progress", "Done").
- **Items** are the primary data records. Each item has a name and column values.
- **Column values** are the cells - each with a type-specific JSON format.
- **Updates** are threaded comments attached to items.

## GraphQL API

**Endpoint:** `https://api.monday.com/v2`
**Auth:** `Authorization: <API_TOKEN>` header (no "Bearer" prefix for API tokens)
**Version:** `API-Version: 2024-10` header

Always use GraphQL variables for user-provided values. Never interpolate strings into queries.

### Rate Limits
- 5,000,000 complexity points per minute
- Each query field costs complexity points; nested queries multiply
- On rate limit: wait for `complexity.reset_in_x_seconds` then retry
- Request only fields you need to minimize complexity cost

### Pagination
- **Items:** Cursor-based via `items_page` → `cursor` → `next_items_page`
- **Boards:** Page-based with `limit` and `page` parameters

## Column Value Formats

When creating or updating items, column values must match these exact JSON formats:

| Column Type | Format | Example |
|---|---|---|
| **Status** | `{ "label": "Label" }` or `{ "index": N }` | `{ "label": "Done" }` |
| **Text** | Plain string | `"Hello world"` |
| **Numbers** | Plain number | `42` |
| **Date** | `{ "date": "YYYY-MM-DD" }` | `{ "date": "2024-03-15" }` |
| **Date + Time** | `{ "date": "YYYY-MM-DD", "time": "HH:mm:ss" }` | `{ "date": "2024-03-15", "time": "09:00:00" }` |
| **Timeline** | `{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }` | `{ "from": "2024-01-01", "to": "2024-01-31" }` |
| **People** | `{ "personsAndTeams": [{ "id": N, "kind": "person" }] }` | `{ "personsAndTeams": [{ "id": 123, "kind": "person" }] }` |
| **Dropdown** | `{ "labels": ["Label1", "Label2"] }` | `{ "labels": ["High"] }` |
| **Checkbox** | `{ "checked": "true" }` | `{ "checked": "true" }` |
| **Email** | `{ "email": "addr", "text": "display" }` | `{ "email": "a@b.com", "text": "Contact" }` |
| **Phone** | `{ "phone": "number", "countryShortName": "CC" }` | `{ "phone": "+1234567890", "countryShortName": "US" }` |
| **Link** | `{ "url": "URL", "text": "display" }` | `{ "url": "https://example.com", "text": "Link" }` |
| **Long Text** | `{ "text": "content" }` | `{ "text": "Detailed description..." }` |
| **Rating** | `{ "rating": N }` (1-5) | `{ "rating": 4 }` |
| **Hour** | `{ "hour": H, "minute": M }` | `{ "hour": 14, "minute": 30 }` |
| **Week** | `{ "week": { "startDate": "...", "endDate": "..." } }` | `{ "week": { "startDate": "2024-01-15", "endDate": "2024-01-21" } }` |
| **World Clock** | `{ "timezone": "TZ" }` | `{ "timezone": "America/New_York" }` |
| **Location** | `{ "lat": N, "lng": N, "address": "..." }` | `{ "lat": 40.7, "lng": -74.0, "address": "NYC" }` |
| **Country** | `{ "countryCode": "CC", "countryName": "Name" }` | `{ "countryCode": "US", "countryName": "United States" }` |
| **Tags** | `{ "tag_ids": [id1, id2] }` | `{ "tag_ids": [123, 456] }` |
| **Color** | `{ "color": "#HEX" }` | `{ "color": "#FF5733" }` |

**Important:** Use `create_labels_if_missing: true` when setting status/dropdown values that may not exist in the board's column settings.

## Common Query Patterns

### List boards
```graphql
query {
  boards(limit: 25) {
    id name description board_kind
    workspace { id name }
    columns { id title type }
    groups { id title }
    items_count
  }
}
```

### Get items with pagination
```graphql
query ($boardId: [ID!]!) {
  boards(ids: $boardId) {
    items_page(limit: 50) {
      cursor
      items {
        id name
        group { id title }
        column_values { id type text value }
      }
    }
  }
}
```

### Create item with column values
```graphql
mutation ($boardId: ID!, $name: String!, $colVals: JSON!) {
  create_item(board_id: $boardId, item_name: $name, column_values: $colVals) {
    id name
    column_values { id type text value }
  }
}
```

### Update column values
```graphql
mutation ($boardId: ID!, $itemId: ID!, $colVals: JSON!) {
  change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $colVals) {
    id name
  }
}
```

## Workflow Best Practices

1. **Always get board structure first** before creating/updating items. Use `monday_get_board` to see available columns and their IDs.
2. **Use groups for stages/categories**. Map your workflow stages to groups (Backlog → In Progress → Done).
3. **Batch column updates**. Use `change_multiple_column_values` to set many columns at once, not one at a time.
4. **Use cursor pagination** for boards with many items. Never fetch all items in one query.
5. **Check for existing data** before creating duplicates. Search first, create second.

## MCP Server

The official monday.com MCP server is available at `https://mcp.monday.com/mcp`. It provides similar capabilities with additional schema introspection. Auth via Bearer token in the Authorization header.
