---
name: monday-create-board
description: Guided board creation wizard. Creates a monday.com board with groups and columns based on your requirements.
---

# Guided monday.com Board Creation

Help the user create a well-structured monday.com board. Follow these steps:

## Step 1: Understand Requirements
Ask the user:
- What is this board for? (project tracking, CRM, sprint planning, content calendar, recruitment, custom)
- What name should the board have?
- Should it be in a specific workspace?

## Step 2: Suggest Structure
Based on the use case, suggest appropriate:

**Project Tracking:**
- Groups: Backlog, To Do, In Progress, Review, Done
- Columns: Status, Person (assignee), Date (due date), Timeline, Priority (status), Text (notes)

**CRM / Sales Pipeline:**
- Groups: Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
- Columns: Status (stage), Person (owner), Email, Phone, Numbers (deal value), Date (close date), Text (company)

**Sprint Planning:**
- Groups: Backlog, Sprint [current], In Progress, Code Review, QA, Done
- Columns: Status, Person, Numbers (story points), Dropdown (type: bug/feature/chore), Date (due), Text (description)

**Content Calendar:**
- Groups: Ideas, Drafting, Review, Scheduled, Published
- Columns: Status, Person (author), Date (publish date), Timeline (production window), Dropdown (channel), Link (URL), Text (topic)

**Recruitment:**
- Groups: Applied, Phone Screen, Technical Interview, Final Round, Offer, Hired
- Columns: Status, Person (recruiter), Email, Phone, Date (applied), Text (position), Link (resume), Rating

## Step 3: Create
1. Create the board with `monday_create_board`
2. Create each group with `monday_create_group`
3. Add each column with `monday_create_column`
4. Optionally create a few sample items to demonstrate the structure

## Step 4: Confirm
Share the board ID and a summary of what was created. Remind the user they can:
- Add more columns or groups as needed
- Set up automations in the monday.com UI
- Invite team members to the board
