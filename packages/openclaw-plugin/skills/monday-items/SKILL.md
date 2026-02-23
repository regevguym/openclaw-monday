---
name: monday-items
description: Complete reference for monday.com items, columns, and column value formats — including the exact JSON structures needed to read and write every column type via the API.
version: 1.0.0
---

# Items, Columns & Column Value Formats

## Items Overview

An item is a single row on a monday.com board. Items are the core unit of work — they represent tasks, deals, requests, bugs, or any entity being tracked.

### Item CRUD Operations

| Operation | API Method | Key Parameters |
|-----------|-----------|----------------|
| Create | `create_item` | `board_id`, `group_id`, `item_name`, `column_values` |
| Read | `items_page` / `items` | `ids`, `board_id`, `query_params` for filtering |
| Update | `change_multiple_column_values` / `change_simple_column_value` | `item_id`, `board_id`, `column_id`, `value` |
| Delete | `delete_item` | `item_id` |
| Archive | `archive_item` | `item_id` |
| Move to group | `move_item_to_group` | `item_id`, `group_id` |
| Duplicate | `duplicate_item` | `item_id`, `board_id` |

When creating or updating items, column values are passed as a JSON string. The format varies by column type and is documented in detail below.

## Columns Overview

Columns define the schema of a board. Each column has a `type`, an `id` (unique within the board), and a `title` (display name). Columns are defined at the board level and apply to every item on that board. monday.com supports over 20 column types.

## Column Value Write Formats

When writing column values, you pass a JSON-encoded string to the `column_values` parameter. Below is the exact format for each column type.

### Status

```json
{ "label": "Done" }
```
Or by index: `{ "index": 1 }`. Using `label` is more readable but requires the label to exist (unless `create_labels_if_missing` is `true`).

### Text

```json
"Hello world"
```
Text columns accept a plain string, not a JSON object.

### Numbers

```json
"42.5"
```
Numbers columns accept a plain string representation of the number.

### Date

```json
{ "date": "2024-01-15", "time": "09:00:00" }
```
The `time` field is optional. Date must be `YYYY-MM-DD`, time must be `HH:MM:SS` (24-hour).

### Timeline

```json
{ "from": "2024-01-01", "to": "2024-01-31" }
```
Both dates in `YYYY-MM-DD` format. The `from` date must be before or equal to `to`.

### People

```json
{ "personsAndTeams": [{ "id": 123, "kind": "person" }, { "id": 789, "kind": "team" }] }
```
The `id` is the user ID or team ID. The `kind` is `"person"` or `"team"`.

### Dropdown

```json
{ "labels": ["Option 1", "Option 3"] }
```
Or by IDs: `{ "ids": [1, 3] }`. Labels must match existing options unless `create_labels_if_missing` is `true`.

### Checkbox

```json
{ "checked": "true" }
```
Note: the value is a string `"true"` or `"false"`, not a boolean.

### Email

```json
{ "email": "user@example.com", "text": "Contact Us" }
```
The `text` field is the clickable display label. If omitted, the email address is shown.

### Phone

```json
{ "phone": "+1234567890", "countryShortName": "US" }
```
The `countryShortName` is the ISO 3166-1 alpha-2 country code.

### Link

```json
{ "url": "https://example.com", "text": "Example Site" }
```
The `text` field is the clickable display label. If omitted, the URL is shown.

### Long Text

```json
{ "text": "This is a longer piece of content.\nIt supports newlines." }
```

### Rating

```json
{ "rating": 4 }
```
Integer value. Pass `{}` to clear.

### Hour

```json
{ "hour": 14, "minute": 30 }
```
`hour` is 0-23 (24-hour format), `minute` is 0-59.

### Week

```json
{ "week": { "startDate": "2024-01-15", "endDate": "2024-01-21" } }
```

### World Clock (Timezone)

```json
{ "timezone": "America/New_York" }
```
Value is an IANA timezone string (e.g., `"Europe/London"`, `"Asia/Tokyo"`).

### Location

```json
{ "lat": 40.7128, "lng": -74.006, "address": "New York, NY" }
```

### Country

```json
{ "countryCode": "US", "countryName": "United States" }
```

### Tags

```json
{ "tag_ids": [123, 456] }
```
Tags are account-level entities. You must use existing tag IDs.

### Color Picker

```json
{ "color": "#FF5733" }
```

### Read-Only Column Types

- **Files** — cannot be set via `column_values` JSON; use the `add_file_to_column` mutation with multipart upload.
- **Mirror (Lookup)** — reflects data from connected boards. Read-only.
- **Formula** — computed from other column values. Read-only.
- **Auto-Number** — auto-incrementing IDs. Read-only, assigned automatically.

## Reading vs Writing Column Values

| Aspect | Reading | Writing |
|--------|---------|---------|
| Format | Rich objects with metadata (`changed_at`, etc.) | Minimal objects with just the value |
| Access | Query `column_values` on an item | Pass `column_values` JSON string to mutations |
| Text/Numbers | Returned as strings | Passed as plain strings (not wrapped in an object) |
| Status | Returns both `label` and `index` | Can write with either `label` or `index` |
| Empty values | Returns `null` or empty object | Pass `null` or `{}` to clear |

When reading, each column value includes:
- `id` — the column ID
- `type` — the column type
- `text` — a human-readable text representation
- `value` — the raw JSON value (as a string that must be parsed)

## The `create_labels_if_missing` Flag

Pass `create_labels_if_missing: true` in create/update mutations to auto-create unknown labels for **status** and **dropdown** columns. Without this flag, unknown labels cause an error.

```graphql
mutation {
  create_item(
    board_id: 123456789
    group_id: "new_group"
    item_name: "New Task"
    column_values: "{\"status\": {\"label\": \"Custom Status\"}}"
    create_labels_if_missing: true
  ) {
    id
  }
}
```

## Column Value Summary Table

| Column Type | Write Format | Plain String? |
|------------|-------------|--------------|
| status | `{ "label": "X" }` or `{ "index": N }` | No |
| text | `"value"` | Yes |
| numbers | `"42"` | Yes |
| date | `{ "date": "YYYY-MM-DD" }` | No |
| timeline | `{ "from": "...", "to": "..." }` | No |
| people | `{ "personsAndTeams": [...] }` | No |
| dropdown | `{ "labels": [...] }` | No |
| checkbox | `{ "checked": "true" }` | No |
| email | `{ "email": "...", "text": "..." }` | No |
| phone | `{ "phone": "...", "countryShortName": "..." }` | No |
| link | `{ "url": "...", "text": "..." }` | No |
| long_text | `{ "text": "..." }` | No |
| rating | `{ "rating": N }` | No |
| hour | `{ "hour": N, "minute": N }` | No |
| week | `{ "week": { "startDate": "...", "endDate": "..." } }` | No |
| world_clock | `{ "timezone": "..." }` | No |
| location | `{ "lat": N, "lng": N, "address": "..." }` | No |
| country | `{ "countryCode": "...", "countryName": "..." }` | No |
| tags | `{ "tag_ids": [...] }` | No |
| color_picker | `{ "color": "#RRGGBB" }` | No |

## Clearing Column Values

To clear any column value, pass an empty object `{}` or `null` as the value for that column. For text and numbers, pass an empty string `""`.
