---
name: monday-api
description: API reference and best practices for the monday.com GraphQL API — covering authentication, rate limiting, complexity, pagination, error handling, common query patterns, and webhooks.
version: 1.0.0
---

# monday.com API Reference & Best Practices

## GraphQL API Overview

monday.com exposes a single GraphQL API endpoint for all operations:

```
POST https://api.monday.com/v2
```

All requests are HTTP POST with a JSON body containing the GraphQL query. The API supports queries (read) and mutations (write).

### Authentication

Authentication uses an API token passed in the `Authorization` header:

```
Authorization: YOUR_API_TOKEN
```

Tokens can be **personal tokens** (generated per user in the Admin section, carrying that user's permissions) or **OAuth tokens** (obtained through the OAuth 2.0 flow for third-party integrations). Never expose tokens in client-side code.

### API Versioning

monday.com uses date-based API versions via the `API-Version` header:

```
API-Version: 2024-10
```

The format is `YYYY-MM`. If omitted, the current stable version is used. Always pin to a specific version in production to avoid breaking changes. Previous versions remain available during a deprecation period (typically several months).

### Basic Request Structure

```bash
curl -X POST "https://api.monday.com/v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_API_TOKEN" \
  -H "API-Version: 2024-10" \
  -d '{"query": "{ boards(limit: 5) { id name } }"}'
```

## Rate Limiting

Rate limits are based on **complexity points**, not request count.

| Metric | Limit |
|--------|-------|
| Complexity points per minute | 5,000,000 |
| Reset window | 1 minute (rolling) |

When exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header. You can check usage by including a `complexity` field in your query:

```graphql
{
  complexity { before after reset_in_x_seconds }
  boards(limit: 5) { id name }
}
```

## Complexity Calculation

Every field in a query costs complexity points. Costs compound for nested queries.

- **Scalar fields** (id, name, etc.) cost a base amount.
- **Object fields** multiply cost by the number of items returned.
- **`limit` parameter** directly affects cost — 100 items costs more than 10.
- **Nested queries** multiply — items inside boards means item cost times number of boards.

**Reduction strategies:** Request only needed fields. Use `limit` aggressively. Avoid deeply nested queries. Use `ids` to target specific entities instead of listing and filtering.

## Pagination

### Cursor-Based Pagination (Items)

Use `items_page` with a cursor for querying items:

```graphql
query {
  boards(ids: [123456789]) {
    items_page(limit: 100) {
      cursor
      items { id name column_values { id text value } }
    }
  }
}
```

For subsequent pages, pass the cursor to `next_items_page`:

```graphql
query {
  next_items_page(limit: 100, cursor: "MSw5NTY3MDE2...") {
    cursor
    items { id name column_values { id text value } }
  }
}
```

When `cursor` is `null`, you have reached the last page.

### Page-Based Pagination (Boards)

For listing boards, use `page` and `limit` parameters:

```graphql
query {
  boards(limit: 25, page: 1) { id name }
}
```

Increment `page` for each request. When the returned list is shorter than `limit`, you have reached the end.

## Error Handling

### Response Format

Successful: `{ "data": { ... }, "account_id": 12345 }`

Error: `{ "errors": [{ "message": "...", "extensions": { "code": "..." } }] }`

### Common Error Codes

| Error Code | Meaning | Resolution |
|-----------|---------|------------|
| `ComplexityException` | Query exceeds complexity budget | Simplify query, reduce `limit`, or wait for reset |
| `ResourceNotFoundException` | Entity not found | Check ID and token access |
| `InvalidArgumentException` | Bad input parameter | Check parameter types and formats |
| `InvalidColumnIdException` | Column ID not on board | Verify column IDs by querying the board |
| `ColumnValueException` | Invalid column value format | Check the expected JSON format for the column type |
| `UserUnauthorizedException` | Token lacks permissions | Use a token with appropriate access |
| `ItemsLimitationException` | Too many items on board | Archive old items or split into multiple boards |
| `RateLimitExceeded` | Too many requests | Wait for `Retry-After` seconds, then retry |

## Best Practices

### 1. Always Use Variables

Never concatenate user input into GraphQL strings. Use GraphQL variables:

```graphql
mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
  create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) { id }
}
```

```json
{
  "variables": {
    "boardId": "123456789",
    "itemName": "New Task",
    "columnValues": "{\"status\": {\"label\": \"Working on it\"}}"
  }
}
```

### 2. Request Only Needed Fields

Each field adds complexity cost. Only select the fields you will use.

### 3. Use Cursor Pagination for Large Datasets

Never load all items at once. Use cursor-based pagination with a reasonable page size (50-200 items).

### 4. Batch Column Value Changes

Use `change_multiple_column_values` to update several columns in one call instead of separate calls per column:

```graphql
mutation {
  change_multiple_column_values(
    item_id: 987654321, board_id: 123456789,
    column_values: "{\"status\": {\"label\": \"Done\"}, \"date4\": {\"date\": \"2024-03-15\"}}"
  ) { id }
}
```

### 5. Handle Rate Limits with Exponential Backoff

On `429` or `ComplexityException`, read `reset_in_x_seconds` and wait. Use exponential backoff: 1s, 2s, 4s, 8s, up to 60s max.

### 6. Use `query_params` for Server-Side Filtering

Filter on the server instead of fetching everything and filtering locally:

```graphql
query {
  boards(ids: [123456789]) {
    items_page(limit: 50, query_params: {
      rules: [{ column_id: "status", compare_value: ["Done"] }]
      operator: and
    }) { items { id name } }
  }
}
```

## Common Query Patterns

### Get Boards in a Workspace

```graphql
query { boards(workspace_ids: [456], limit: 50) { id name board_kind state } }
```

### Get Board Schema (Columns and Groups)

```graphql
query {
  boards(ids: [123456789]) {
    id name
    columns { id title type }
    groups { id title color }
  }
}
```

### Create an Item

```graphql
mutation {
  create_item(
    board_id: 123456789, group_id: "new_group", item_name: "New Task",
    column_values: "{\"status\": {\"label\": \"Working on it\"}, \"person\": {\"personsAndTeams\": [{\"id\": 12345, \"kind\": \"person\"}]}}",
    create_labels_if_missing: true
  ) { id name }
}
```

### Get Current User

```graphql
query { me { id name email is_admin account { id slug } } }
```

## Webhooks

monday.com supports webhooks for real-time event notifications.

### Creating a Webhook

```graphql
mutation {
  create_webhook(board_id: 123456789, url: "https://your-server.com/webhook", event: change_column_value) { id board_id }
}
```

### Supported Events

| Event | Trigger |
|-------|---------|
| `change_column_value` | Any column value updated |
| `change_status_column_value` | A status column changes |
| `change_specific_column_value` | A specified column changes |
| `create_item` | New item created |
| `delete_item` | Item deleted |
| `create_update` | New comment posted |
| `create_subitem` | Subitem created |
| `change_subitem_column_value` | Subitem column value changes |

### Webhook Verification

On first registration, monday.com sends a verification request. Respond with the same `challenge` value:

```json
// Request:  { "challenge": "abc123xyz" }
// Response: { "challenge": "abc123xyz" }
```

## MCP Server

monday.com provides an official MCP (Model Context Protocol) server for AI agent integration:

```
https://mcp.monday.com/mcp
```

This server exposes monday.com operations as MCP tools, allowing AI agents to interact with boards, items, and columns through the standardized MCP protocol. It handles authentication, rate limiting, and API versioning automatically. Prefer the MCP server for AI agent integrations over direct GraphQL API calls.
