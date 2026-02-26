---
name: monday-com-claude-code
description: Claude Code monday.com integration optimized for development workflows and code intelligence
version: 3.0.0
globs: ["**/*monday*", "**/*board*", "**/*project*", "**/*sprint*"]
alwaysApply: false
---

# monday.com for Claude Code

**Claude Code native monday.com integration** optimized for software development workflows.

**Requires:** Standard monday.com tools (like `monday_create_board`, `monday_create_item`, etc.) via MCP server or direct API access.

## Development-First Features

**🚀 Code Intelligence:**
- Analyze codebase structure to suggest board layouts
- Convert repository issues to monday.com items
- Map git branches to sprint planning
- Track development milestones automatically

**📋 Smart Board Templates:**
- Sprint planning with story point estimation
- Bug tracking with severity classification
- Feature development with approval workflows
- Code review coordination boards

**🔄 Git Integration:**
- Branch names → Board items
- Commit messages → Progress updates
- PR status → Review workflow tracking
- Release tags → Milestone completion

## Development Board Templates

### Sprint Planning Workflow
When user requests sprint planning:
1. `monday_create_board("Sprint [Number]")`
2. Create groups: `monday_create_group("Backlog")`, `monday_create_group("Active")`, etc.
3. Add columns: `monday_create_column("Status", "status")`, `monday_create_column("Story Points", "numbers")`
4. Return board link and summary

### Bug Tracking Workflow
For bug management:
1. `monday_create_board("Bug Tracker")`
2. Groups: "New", "Assigned", "In Progress", "Testing", "Resolved"
3. Columns: "Priority" (dropdown), "Severity" (status), "Assignee" (people)

### Project Synchronization
To sync codebase with monday.com:
1. Scan files for TODO/FIXME comments
2. `monday_create_item` for each TODO with appropriate column values
3. Link to source code location in item description
4. Suggest grouping by file or feature area

## Development Workflow Integration

**Repository Analysis:**
```javascript
// TODO: Implement user authentication
// FIXME: Login timeout on mobile
// NOTE: Consider Redis for session storage
```
→ **Auto-creates items:** "Implement user authentication", "Fix mobile login timeout", "Evaluate Redis for sessions"

**Commit Message Tracking:**
```bash
git commit -m "feat: user dashboard complete"
# → Updates "User Dashboard" item status to "Done"

git commit -m "fix: resolve login timeout issue"
# → Updates bug item status and adds completion comment
```

**Pull Request Workflow:**
```
PR created → monday.com item moves to "Review"
PR approved → Item moves to "Ready for Deploy"
PR merged → Item status updated to "Done"
```

## Code Context Awareness

**Smart Column Selection:**
- **Web projects:** Add "Browser Compatibility", "Performance", "SEO" columns
- **API projects:** Add "Endpoint URL", "Documentation Status" columns
- **Mobile apps:** Add "Platform", "App Store Status" columns
- **Libraries:** Add "Version", "Breaking Changes", "Migration Guide" columns

**Intelligent Item Creation:**
- Function names → Feature implementation items
- Test files → QA verification items
- Documentation files → Documentation task items
- Configuration files → DevOps setup items

## Session Integration

**Development Session Tracking:**
```
> **Coding Session - User Auth Feature**
> Duration: 2.5 hours | Files: 8 modified
> - Completed: Login component, Auth service
> - In Progress: Password reset flow
> - Blocked: Email service configuration
> → [View sprint board](https://acme.monday.com/boards/123456)
```

**Context Preservation:**
- Current development focus
- Architectural decisions made
- Code patterns established
- Testing approaches used

---

*Optimized for Claude Code's development workflow intelligence. Seamlessly bridges code understanding with project management.*