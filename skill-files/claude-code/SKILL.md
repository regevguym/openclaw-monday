---
name: monday-com
description: Claude Code integration for monday.com - streamlined workflows, automated board management, and intelligent project orchestration
version: 3.0.0
globs: ["**/*monday*", "**/*board*", "**/project*", "**/sprint*"]
alwaysApply: false
---

# monday.com for Claude Code

**Development-optimized monday.com integration** using standard monday.com tools.

**Prerequisites:**
1. API token in environment: `MONDAY_API_TOKEN=your_token_here`
2. monday.com MCP server configured, OR
3. Monday.com tools available (like `monday_create_board`, `monday_get_account_info`, etc.)

**Available Tools:** Works with any monday.com integration that provides these tools:
- `monday_get_account_info`, `monday_list_workspaces`, `monday_list_boards`
- `monday_create_board`, `monday_get_board`, `monday_create_group`, `monday_create_column`
- `monday_create_item`, `monday_update_item_columns`, `monday_move_item_to_group`
- `monday_create_doc`, `monday_search`, `monday_raw_graphql`

**Core Behaviors:** Act immediately when intent is clear, return clickable links, cache session data for speed.

## Development Workflows

### Session Initialization
When starting monday.com work, automatically:
1. Call `monday_get_account_info` → Cache account slug and user details
2. Call `monday_list_workspaces` → Cache available workspaces
3. Store in memory for link generation and workspace selection

### Smart Board Creation
When user requests a board, analyze context to create appropriate template:

**Sprint Board Pattern:**
```
1. monday_create_board("Sprint [Number]", workspace_id)
2. monday_create_group("Backlog"), monday_create_group("In Progress"), etc.
3. monday_create_column("Status", "status"), monday_create_column("Assignee", "people")
4. Return link: https://{slug}.monday.com/boards/{board_id}
```

**Bug Tracker Pattern:**
```
1. monday_create_board("Bug Tracker", workspace_id)
2. Groups: "New", "Assigned", "In Progress", "Testing", "Resolved"
3. Columns: "Status", "Priority", "Assignee", "Severity"
```

### Project Sync Workflow
When syncing current project:
1. Scan for TODO comments in code files
2. Use `monday_create_item` for each TODO with appropriate column values
3. If board doesn't exist, create appropriate template first
4. Return summary with links to created items

## Core Principles

**Execute Immediately:** No confirmation for standard operations (create, update, move, search)
**Return Links:** Every action returns clickable monday.com URLs
**Cache Session Data:** Store account slug, workspace IDs, board structures in session memory

## Link Generation & Session Cache

**Auto-generate links:** All operations return `https://{slug}.monday.com/{type}/{id}`
**Session data storage:** Cache in memory or temporary storage for session duration

**Cached data structure:**
```yaml
account: { slug, user_id, user_name, plan_tier }
workspaces: [{ name, id, kind }]
active_boards: [{ name, id, link, purpose, columns, groups }]
project_mapping: { repo_name: board_id, issue_tracker: board_id }
```

**Auto-linking patterns:**
- Board operations → `boards/{board_id}`
- Item operations → `boards/{board_id}/pulses/{item_id}`
- Doc operations → `docs/{doc_id}`

## Development Workflow Integration

**Auto-initialization:** When monday.com tools are invoked:
1. Check session memory for cached account data
2. If missing, silently call `monday_get_account_info` and `monday_list_workspaces`
3. Store slug, user info, and workspace list in session memory

**Error Recovery:** Auto-retry with corrected parameters:
- Column format errors → Check schema and retry
- Invalid IDs → Refresh board data and retry
- Rate limits → Wait and retry silently
- Only surface unresolvable errors to user

## Board Templates

**Sprint Board (`/create-board sprint`):**
- Groups: Backlog, Todo, In Progress, Review, Done
- Columns: Status, Assignee, Story Points, Priority, Sprint

**Project Board (`/create-board project`):**
- Groups: Planning, Active, Testing, Complete
- Columns: Status, Owner, Due Date, Progress, Type

**Bug Board (`/create-board bugs`):**
- Groups: New, Assigned, In Progress, Testing, Resolved
- Columns: Status, Priority, Assignee, Severity, Reporter

## Quick Reference

**Column Types:** `status` `people` `date` `timeline` `numbers` `dropdown` `checkbox` `text` `email` `phone` `link` `file` `tags`

**Link Patterns:** `https://{slug}.monday.com/{boards|docs|dashboards}/{id}`

**Memory Storage:** Board schemas, workspace mappings, and user preferences cached in session for instant access.

## Column Value Reference

Essential formats for updating items:
- **status:** `{ "label": "Working on it" }`
- **people:** `{ "personsAndTeams": [{"id": 12345}] }`
- **date:** `{ "date": "2024-03-15" }`
- **timeline:** `{ "from": "2024-01-15", "to": "2024-01-20" }`
- **numbers:** `42.5` (raw number)
- **text:** `"String value"`

## Advanced Usage

**Raw GraphQL:** Use `monday_raw_graphql` for complex queries
**Schema Discovery:** Run `monday_get_schema` to explore API
**Token Security:** Store as `MONDAY_API_TOKEN` environment variable

---

*For complete monday.com API documentation, see https://developer.monday.com/api-reference/*
