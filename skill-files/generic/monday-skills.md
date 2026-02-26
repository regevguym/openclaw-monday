---
name: monday-agent-universal
description: Universal monday.com agent behavior patterns for any AI system - optimized for speed and clarity
version: 3.0.0
globs: ["**/*monday*", "**/*board*", "**/*workspace*"]
alwaysApply: false
---

# monday.com Universal Agent Guide

**Behavioral patterns for AI agents working with monday.com** - optimized for immediate action and clear communication.

**Works with:** Any monday.com integration providing standard tools like `monday_create_board`, `monday_create_item`, `monday_get_account_info`, etc.

**Core Pattern:** Execute immediately when intent is clear → Return clickable links → Cache essential data for future reference.

## Essential Behaviors

**✅ Act Immediately:**
- Create boards, items, docs without asking for confirmation
- Execute searches, updates, moves when intent is clear
- Only ask when genuinely ambiguous ("make a board" with no context)

**🔗 Always Return Links:**
- Board: `https://{slug}.monday.com/boards/{board_id}`
- Item: `https://{slug}.monday.com/boards/{board_id}/pulses/{item_id}`
- Doc: `https://{slug}.monday.com/docs/{doc_id}`
- Get `{slug}` from account info and cache it

**💾 Cache Key Data:**
- Account slug and user info
- Workspace names and IDs
- Active board schemas (columns, groups)
- Important item references

**📝 Report Results, Not Process:**
- **Bad:** "I'll now call monday_create_board with parameters..."
- **Good:** "Created Sprint Board → [Open](https://acme.monday.com/boards/123)"

**🔄 Auto-Retry Errors:**
- Column format errors → Fix format and retry
- Invalid IDs → Refresh schema and retry
- Rate limits → Wait and retry silently
- Only surface unresolvable errors

## Quick Actions

**Board Creation:**
```
> Created **Sprint Planning** in Development workspace
> Groups: Backlog, Active, Review, Done
> → [Open board](https://acme.monday.com/boards/123456)
```

**Item Creation:**
```
> Added **Fix login bug** to Sprint Board → In Progress
> Assigned: Sarah, Priority: P1
> → [View item](https://acme.monday.com/boards/123/pulses/456)
```

**Batch Operations:**
```
> Created 5 tasks in **Project Alpha**:
> - Setup database → Todo
> - Design UI mockups → In Progress
> - Write API endpoints → Todo
> → [View board](https://acme.monday.com/boards/789)
```

## Column Value Formats

| Type | Format | Example |
|---|---|---|
| status | `{"label": "Working on it"}` | Status updates |
| people | `{"personsAndTeams": [{"id": 123}]}` | Assignments |
| date | `{"date": "2024-03-15"}` | Deadlines |
| timeline | `{"from": "2024-01-15", "to": "2024-01-20"}` | Date ranges |
| numbers | `42.5` | Story points, budgets |
| text | `"String value"` | Descriptions |

## Memory Pattern

Save these after operations:
- **Account:** `{slug, user_id, user_name}`
- **Workspaces:** `[{name, id, kind}]`
- **Active Boards:** `[{name, id, link, columns, groups}]`
- **Key Items:** `[{name, id, board_id, link, status}]`

This enables context like: "Update the login bug" → Agent knows which item and board to modify.

---

*This guide works with any monday.com integration. For IDE-specific commands and advanced features, use specialized skill files.*