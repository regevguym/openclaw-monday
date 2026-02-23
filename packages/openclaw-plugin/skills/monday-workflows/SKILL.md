---
name: monday-workflows
description: Common workflow patterns, board design strategies, and automation recipes for monday.com — covering project management, CRM, sprints, recruitment, content calendars, and collaboration best practices.
version: 1.0.0
---

# Common Workflow Patterns & Automation

## Overview

monday.com is flexible enough to support many different workflows. This skill covers the most common patterns, board design strategies, and automation recipes.

## Workflow 1: Project Tracking

Use monday.com as a project management tool where each project is a board and tasks are items.

### Board Structure

```
Board: "Website Redesign" (the project)
 ├── Group: "Planning"
 │    ├── Item: "Define requirements"
 │    ├── Item: "Create wireframes"
 │    └── Item: "Stakeholder review"
 ├── Group: "Design"
 │    ├── Item: "Homepage mockup"
 │    └── Item: "Mobile layout"
 ├── Group: "Development"
 │    ├── Item: "Frontend implementation"
 │    └── Item: "Backend API"
 └── Group: "QA & Launch"
      ├── Item: "Browser testing"
      └── Item: "Go-live checklist"
```

### Recommended Columns

| Column | Type | Purpose |
|--------|------|---------|
| Status | status | Task progress (Not Started / Working on it / Done) |
| Owner | people | Who is responsible |
| Due Date | date | Deadline |
| Timeline | timeline | Start-to-end date range for Gantt views |
| Priority | status | Urgency level (Low / Medium / High / Critical) |
| Estimated Hours | numbers | Effort estimate |
| Tags | tags | Cross-cutting labels (e.g., "frontend", "design") |

### Key Views

- **Table View** for day-to-day task management
- **Timeline View** (Gantt) for scheduling and dependencies
- **Workload View** for balancing assignments across team members

## Workflow 2: CRM (Customer Relationship Management)

Use a board as a sales pipeline where groups represent deal stages and items represent deals or leads.

### Board Structure

```
Board: "Sales Pipeline Q1 2024"
 ├── Group: "New Leads"
 │    ├── Item: "Acme Corp"
 │    └── Item: "Globex Inc"
 ├── Group: "Qualified"
 │    └── Item: "Wayne Enterprises"
 ├── Group: "Proposal Sent"
 │    └── Item: "Stark Industries"
 ├── Group: "Negotiation"
 │    └── Item: "Umbrella Corp"
 └── Group: "Closed Won"
      └── Item: "Initech"
```

### Recommended Columns

| Column | Type | Purpose |
|--------|------|---------|
| Deal Value | numbers | Dollar amount of the deal |
| Contact Name | text | Primary contact person |
| Contact Email | email | Contact email address |
| Contact Phone | phone | Contact phone number |
| Company | text | Company name |
| Stage | status | Current pipeline stage |
| Close Date | date | Expected close date |
| Owner | people | Sales rep responsible |
| Priority | status | Deal priority |
| Notes | long_text | Freeform notes about the deal |

### Key Views

- **Kanban View** grouped by Stage column for visual pipeline management
- **Chart View** for deal value aggregation by stage
- **Calendar View** for close date tracking

### Tips

- Move items between groups as deals progress through stages, or use a Status column to track stage (which enables Kanban).
- Use automations to notify the sales rep when a deal has been idle for too long.
- Create a dashboard that aggregates multiple pipeline boards for executive reporting.

## Workflow 3: Sprint Planning

Use a board per sprint (or a single board with groups per sprint) for agile software development.

### Board Structure

```
Board: "Sprint 14 — Jan 15-28"
 ├── Group: "Backlog"
 │    ├── Item: "Refactor auth module"
 │    └── Item: "Add export feature"
 ├── Group: "To Do"
 │    └── Item: "Fix login timeout bug"
 ├── Group: "In Progress"
 │    └── Item: "Build dashboard widget"
 ├── Group: "In Review"
 │    └── Item: "Update API documentation"
 └── Group: "Done"
      └── Item: "Deploy v2.3 hotfix"
```

### Recommended Columns

| Column | Type | Purpose |
|--------|------|---------|
| Status | status | Current state (mirrors group placement) |
| Assignee | people | Developer responsible |
| Story Points | numbers | Effort estimate |
| Priority | status | P0 / P1 / P2 / P3 |
| Type | status | Bug / Feature / Chore / Spike |
| Sprint | dropdown | Sprint identifier (if using a single board) |
| Due Date | date | Sprint end date or task deadline |
| Link to PR | link | GitHub pull request URL |
| Labels | tags | Component tags (frontend, backend, infra) |

### Key Views

- **Kanban View** grouped by Status for daily standups
- **Table View** for sprint planning sessions
- **Chart View** for burndown tracking (story points by status)

### Tips

- Use subitems for subtasks within a story (e.g., "Design", "Implement", "Write tests").
- At sprint end, archive completed items or move them to a "Completed Sprints" board.
- Integrate with GitHub to auto-update status when PRs are merged.

## Workflow 4: Recruitment

Use a board per open position where groups represent hiring stages.

### Board Structure

```
Board: "Senior Engineer — Hiring"
 ├── Group: "Applied"
 │    ├── Item: "Jane Smith"
 │    └── Item: "John Doe"
 ├── Group: "Phone Screen"
 │    └── Item: "Alice Chen"
 ├── Group: "Technical Interview"
 │    └── Item: "Bob Wilson"
 ├── Group: "Final Round"
 │    └── Item: "Carol Martinez"
 ├── Group: "Offer Extended"
 │    └── Item: "David Kim"
 └── Group: "Rejected"
      └── Item: "Eve Johnson"
```

### Recommended Columns

| Column | Type | Purpose |
|--------|------|---------|
| Email | email | Candidate's email |
| Phone | phone | Candidate's phone |
| Resume | files | Uploaded resume/CV |
| Source | dropdown | Where the candidate came from (LinkedIn, Referral, etc.) |
| Interviewer | people | Assigned interviewer |
| Interview Date | date | Scheduled interview date |
| Rating | rating | Overall candidate rating |
| Salary Expectation | numbers | Expected compensation |
| Notes | long_text | Interview feedback and notes |
| Stage Status | status | Current hiring stage |

### Key Views

- **Kanban View** by group for pipeline visualization
- **Calendar View** for interview scheduling
- **Form View** for candidates to self-apply

## Workflow 5: Content Calendar

Use a board to plan and schedule content publication across channels.

### Board Structure

```
Board: "Content Calendar — Q1 2024"
 ├── Group: "Blog Posts"
 │    ├── Item: "How to Use AI in Marketing"
 │    └── Item: "2024 Industry Trends Report"
 ├── Group: "Social Media"
 │    ├── Item: "LinkedIn: Product launch post"
 │    └── Item: "Twitter: Weekly tips thread"
 ├── Group: "Email Campaigns"
 │    └── Item: "January Newsletter"
 └── Group: "Video Content"
      └── Item: "Product demo walkthrough"
```

### Recommended Columns

| Column | Type | Purpose |
|--------|------|---------|
| Status | status | Draft / In Review / Approved / Published |
| Publish Date | date | Target publication date |
| Author | people | Content creator |
| Channel | dropdown | Blog, LinkedIn, Twitter, Email, YouTube |
| Timeline | timeline | Content creation window (start to publish) |
| Content Link | link | URL to published content or draft |
| Approval | status | Pending / Approved / Rejected |
| Tags | tags | Topic tags (product, thought-leadership, tutorial) |

### Key Views

- **Calendar View** by Publish Date for scheduling overview
- **Timeline View** for seeing content production windows
- **Kanban View** by Status for tracking progress

## Common Automation Patterns

monday.com automations follow a "When → Then" pattern. Here are the most commonly used recipes:

### Status Change Triggers

- **When** status changes to "Done" **then** notify the item's owner
- **When** status changes to "Stuck" **then** notify the team lead
- **When** status changes to "Done" **then** move item to "Completed" group
- **When** all subitems are "Done" **then** change parent item status to "Done"

### Due Date Automations

- **When** a date arrives **then** notify the assignee
- **When** a date is X days away **then** change status to "At Risk"
- **When** a date has passed and status is not "Done" **then** notify the manager

### Item Creation Automations

- **When** an item is created **then** assign the creator as owner
- **When** an item is created in a specific group **then** set default status
- **When** an item is created **then** notify the team channel

### Cross-Board Automations

- **When** status changes to "Done" **then** create an item in another board
- **When** a date arrives **then** create an update on the item

## Board Design Best Practices

### Sizing Guidelines

- Keep boards under 10,000 items for optimal performance.
- Use 3-8 groups per board for clarity.
- Limit to 20-30 columns per board — more columns slow down the UI and increase API complexity costs.

### When to Use Subitems vs Separate Boards

Use **subitems** when:
- The child tasks are tightly coupled to the parent (e.g., subtasks of a feature)
- You need to see parent and child together in one view
- The child tasks share a similar, simple structure

Use **separate boards** when:
- The child entities have a very different column structure than the parent
- The child entities need independent access control
- The relationship is between independent entities (e.g., projects and clients)
- You need to track the child entities across multiple parents

### Group Naming Conventions

- Use clear, mutually exclusive names.
- Order groups to reflect a natural progression (left to right, top to bottom).
- Prefix with numbers if order matters: "1. Planning", "2. Design", "3. Development".

## Using Updates for Collaboration

Updates (comments) on items are the primary collaboration mechanism:

- Use `@mentions` to notify specific users.
- Pin important updates so they stay at the top of the thread.
- Use updates for status reports, blockers, and handoffs between team members.
- Attach files to updates for contextual documentation (screenshots, specs).
- Use the API's `create_update` mutation to programmatically post updates (e.g., from CI/CD pipelines or external systems).

### Update Best Practices

- Post a summary update when moving an item to a new stage.
- Use updates instead of separate "Notes" columns for conversational context — they are threaded and timestamped.
- Integrate external tools (Slack, email) to post updates automatically.
