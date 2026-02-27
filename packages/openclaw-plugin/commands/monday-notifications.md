---
name: monday-notifications
description: Manage monday.com notification forwarding and agent processing
category: integrations
icon: 📬
---

# monday.com Notification Forwarding

```
       ▄▄
      ▄██▄
      █OO█
      █< █
      ████
      ████
      ██████████████████ ▌
      ██████████████████
      ██████████████████
      ▀██████████████▀██
      ▀███          ███▀
       ▀██          ██▀
         |          |

       🦙 Notifications! 🦙
```

Intelligently forward your monday.com notifications to the OpenClaw AI agent for smart processing, auto-responses, and user alerts.

## What This Does

The notification forwarder polls your monday.com account for new notifications and enriches each one with full context (item details, board info, recent updates). The AI agent then uses the **monday-soul.md** behavioral rules to decide how to handle each notification:

- **Auto-respond** — answer simple questions or acknowledge assignments directly in monday.com
- **Take action** — update item status, move items, or perform other monday.com operations
- **Notify you** — send a contextual message via your messaging gateway (WhatsApp, etc.) with a recommended action
- **Batch & dismiss** — accumulate low-priority updates for a daily summary

## Quick Start

### Enable Notification Forwarding

```
/monday-notifications
```

This activates polling with the default 60-second interval.

### Check Status

Use the `monday_get_notification_stats` tool to see:
- How many notifications have been processed
- Breakdown by type (mentions, assignments, status changes, replies)
- Whether polling is active

### View Recent Notifications

Use `monday_get_notifications` to fetch your latest notifications with full context.

### Configure Settings

Use `monday_configure_notifications` to:
- **Enable/disable** polling: `{ "enabled": true }` or `{ "enabled": false }`
- **Change poll interval**: `{ "poll_interval_seconds": 30 }` (minimum 10s)

## How It Works

1. **Poll** — Every 60s (configurable), fetch new notifications from monday.com
2. **Deduplicate** — Skip notifications already seen (persisted across restarts)
3. **Enrich** — For each new notification, fetch the related item's full context:
   - Item name, status, and column values
   - Board name and link
   - Last 5 updates/comments
   - Who triggered the notification
4. **Surface** — Pass the enriched notification to the AI agent
5. **Agent decides** — Following `monday-soul.md` rules, the agent chooses to respond, act, notify, or batch

## Available Tools

| Tool | Description |
|------|-------------|
| `monday_get_notifications` | Fetch recent notifications with enriched context |
| `monday_get_notification_stats` | Get notification counts by type and polling status |
| `monday_configure_notifications` | Enable/disable polling, change interval |

## Notification Types & Agent Behavior

| Type | Agent Default Action |
|------|---------------------|
| **Direct mention** | Read context, respond if possible, otherwise notify user |
| **Assignment** | Acknowledge, check if action needed |
| **Deadline (< 48h)** | Alert user with urgency level |
| **Status change** | Evaluate if user needs to know, summarize impact |
| **Reply to your comment** | Read context, respond if straightforward |
| **General updates** | Batch for low-priority summary |

## State Persistence

Seen notification IDs are saved to `~/.openclaw/monday-notifications-state.json`. This means:
- Restarting the plugin won't re-process old notifications
- Up to 500 most recent IDs are tracked
- Clear the file to reset and re-process all notifications

## Tips

- Start with the default 60s interval and adjust based on your notification volume
- The agent follows your `monday-soul.md` rules — customize that file to change behavior
- Pair this with the WhatsApp sync (`/monday-whatsapp-sync`) for a complete communication loop
