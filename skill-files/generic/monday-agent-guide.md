# monday.com Agent Guide

Universal reference for any AI agent working with monday.com. Paste this into your LLM's context or system prompt.

---

## What is monday.com?

monday.com is a work management platform. Data is organized as:

```
Account
 └── Workspaces (organizational containers)
      └── Boards (like database tables)
           ├── Columns (field definitions, shared by all items)
           ├── Groups (visual sections, e.g. "To Do", "Done")
           │    └── Items (rows/records)
           │         ├── Column Values (cell data, type-specific JSON)
           │         ├── Subitems (child items)
           │         └── Updates (threaded comments)
           └── Views (Table, Kanban, Timeline, Calendar, etc.)
```

## API Access

**GraphQL endpoint:** `POST https://api.monday.com/v2`

**Headers:**
```
Content-Type: application/json
Authorization: <YOUR_API_TOKEN>
API-Version: 2024-10
```

**Body:** `{ "query": "...", "variables": { ... } }`

**Rate limits:** 5,000,000 complexity points per minute. Request only needed fields.

**Pagination:** Cursor-based for items. First call returns a `cursor`; pass it to `next_items_page` for subsequent pages.

## Column Value Formats

When creating/updating items, set `column_values` as a JSON string with this structure per column type:

| Column Type | JSON Format |
|---|---|
| Status | `{ "label": "Done" }` or `{ "index": 1 }` |
| Text | `"plain string"` |
| Numbers | `42` (plain number) |
| Date | `{ "date": "2024-01-15" }` |
| Date + Time | `{ "date": "2024-01-15", "time": "09:00:00" }` |
| Timeline | `{ "from": "2024-01-01", "to": "2024-01-31" }` |
| People | `{ "personsAndTeams": [{ "id": 123, "kind": "person" }] }` |
| Dropdown | `{ "labels": ["Option 1", "Option 2"] }` |
| Checkbox | `{ "checked": "true" }` |
| Email | `{ "email": "user@example.com", "text": "Display Name" }` |
| Phone | `{ "phone": "+1234567890", "countryShortName": "US" }` |
| Link | `{ "url": "https://example.com", "text": "Display Text" }` |
| Long Text | `{ "text": "Long content here..." }` |
| Rating | `{ "rating": 4 }` (1-5 scale) |
| Hour | `{ "hour": 14, "minute": 30 }` |
| Week | `{ "week": { "startDate": "2024-01-15", "endDate": "2024-01-21" } }` |
| World Clock | `{ "timezone": "America/New_York" }` |
| Location | `{ "lat": 40.7128, "lng": -74.0060, "address": "New York, NY" }` |
| Country | `{ "countryCode": "US", "countryName": "United States" }` |
| Tags | `{ "tag_ids": [123, 456] }` |
| Color Picker | `{ "color": "#FF5733" }` |

**Tip:** Use `create_labels_if_missing: true` in mutations when setting status or dropdown values that may not exist yet.

## Essential Queries

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

### Get board details
```graphql
query ($boardId: [ID!]!) {
  boards(ids: $boardId) {
    id name
    columns { id title type settings_str }
    groups { id title color }
    items_page(limit: 50) {
      cursor
      items { id name column_values { id type text value } }
    }
  }
}
```

### Create item with column values
```graphql
mutation ($boardId: ID!, $itemName: String!, $colVals: JSON!) {
  create_item(board_id: $boardId, item_name: $itemName, column_values: $colVals) {
    id name column_values { id type text value }
  }
}
# Variables: { "boardId": 123, "itemName": "New Task", "colVals": "{\"status\": {\"label\": \"Working on it\"}, \"date4\": {\"date\": \"2024-03-15\"}}" }
```

### Update item columns
```graphql
mutation ($boardId: ID!, $itemId: ID!, $colVals: JSON!) {
  change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $colVals) {
    id name
  }
}
```

### Post a comment
```graphql
mutation ($itemId: ID!, $body: String!) {
  create_update(item_id: $itemId, body: $body) {
    id body created_at
  }
}
```

### Paginate items
```graphql
# First page (use boards query)
# Subsequent pages:
query ($cursor: String!) {
  next_items_page(cursor: $cursor, limit: 50) {
    cursor
    items { id name column_values { id type text value } }
  }
}
```

## Best Practices

1. **Get board structure first.** Before creating/updating items, query the board to see column IDs and types.
2. **Use GraphQL variables.** Never interpolate user data into query strings.
3. **Batch column updates.** Use `change_multiple_column_values` to update many columns at once.
4. **Paginate large datasets.** Use cursor-based pagination for items.
5. **Minimize field selection.** Only request fields you need to reduce complexity cost.
6. **Search before creating.** Check for existing data to avoid duplicates.
7. **Handle rate limits.** If you hit a rate limit, wait for the `reset_in_x_seconds` value and retry.

## MCP Server

monday.com provides an official MCP server at `https://mcp.monday.com/mcp`. Authenticate with a Bearer token in the Authorization header. This provides tool-based access to the same API capabilities.

## Common Workflow Patterns

**Project Tracking:** Board per project → Groups for phases (Backlog, In Progress, Review, Done) → Items for tasks → Status/Person/Date columns

**CRM Pipeline:** Board per pipeline → Groups for stages (Lead, Qualified, Proposal, Closed) → Items for deals → Email/Phone/Numbers(value) columns

**Sprint Board:** Board per sprint → Groups for status (To Do, In Progress, QA, Done) → Items for stories → Numbers(points)/Person/Status columns
