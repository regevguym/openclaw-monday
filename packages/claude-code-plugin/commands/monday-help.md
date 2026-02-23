---
name: monday-help
description: Quick reference for monday.com operations. Shows available tools and common patterns.
---

# monday.com Quick Reference

You have access to the monday.com MCP server. Here are the key operations:

## Available Operations

### Boards
- **List boards**: Query boards with optional workspace/kind filters
- **Get board details**: Full board info including columns, groups, owners
- **Create board**: New board with optional template, workspace, description
- **Delete board**: Permanently remove a board

### Items (Rows)
- **Get items**: Fetch items from a board with filtering and pagination
- **Create item**: Add a new item with column values
- **Update item columns**: Modify column values on an existing item
- **Move item**: Move to a different group
- **Delete item**: Permanently remove an item

### Column Values
When setting column values, use these JSON formats:
- **Status**: `{ "label": "Done" }` or `{ "index": 1 }`
- **Date**: `{ "date": "2024-01-15" }`
- **People**: `{ "personsAndTeams": [{ "id": 123, "kind": "person" }] }`
- **Dropdown**: `{ "labels": ["Option 1"] }`
- **Email**: `{ "email": "a@b.com", "text": "display" }`
- **Link**: `{ "url": "https://...", "text": "display" }`
- **Numbers**: just a number value
- **Text**: just a string value

### Other Operations
- **Groups**: List, create, move items between groups
- **Updates/Comments**: Post comments, get update history, reply to updates
- **Documents**: List, create, read monday.com docs
- **Workspaces**: List and create workspaces
- **Users & Teams**: List all users and teams
- **Search**: Search across boards and items

## Common Patterns

**Create a project board with tasks:**
1. Create board → note the board_id
2. Create groups for phases (Backlog, In Progress, Done)
3. Add columns (status, person, date, etc.)
4. Create items in appropriate groups with column values

**Update task status:**
1. Get items to find the item_id
2. Update column values with new status

**Add a comment to a task:**
1. Create update on the item with the comment body

## Tips
- Use `create_labels_if_missing: true` when setting status/dropdown values that may not exist yet
- Always pass column values as a JSON object: `{ "column_id": value }`
- Use cursor-based pagination for boards with many items
- The API has rate limits - batch operations when possible
