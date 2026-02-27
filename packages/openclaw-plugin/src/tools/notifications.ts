/**
 * Notification tools for monday.com
 * Tools: monday_get_notifications, monday_get_notification_stats, monday_configure_notifications
 *
 * Uses the `updates` top-level query since the monday.com API v2024-10
 * does not expose a `notifications` field.
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";
import type { NotificationForwarder } from "../integrations/notification-forwarder.js";

// --- Schemas ---

export const GetNotificationsParams = Type.Object({
  limit: Type.Optional(
    Type.Number({
      description: "Max notifications to return (default 25)",
      default: 25,
    })
  ),
});

export const GetNotificationStatsParams = Type.Object({});

export const ConfigureNotificationsParams = Type.Object({
  poll_interval_seconds: Type.Optional(
    Type.Number({
      description:
        "Polling interval in seconds (minimum 10, default 60)",
    })
  ),
  enabled: Type.Optional(
    Type.Boolean({
      description: "Enable or disable notification polling",
    })
  ),
});

// --- Tool Implementations ---

export async function getNotifications(
  client: MondayClient,
  forwarder: NotificationForwarder,
  params: Static<typeof GetNotificationsParams>
) {
  const limit = params.limit ?? 25;

  const data = await client.queryWithRetry(
    `query {
      updates(limit: ${limit}) {
        id
        text_body
        body
        created_at
        creator_id
        creator { id name }
        item_id
        item {
          id
          name
          board { id name }
        }
        replies {
          id
          text_body
          creator { name }
          created_at
        }
      }
    }`
  );

  const updates = data?.updates || [];

  return {
    updates,
    count: updates.length,
    polling_active: forwarder.isPolling,
    seen_count: forwarder.seenCount,
  };
}

export async function getNotificationStats(
  client: MondayClient,
  forwarder: NotificationForwarder
) {
  const data = await client.queryWithRetry(
    `query {
      updates(limit: 50) {
        id
        text_body
        body
        created_at
        creator_id
        replies { id }
      }
    }`
  );

  const updates = data?.updates || [];

  const stats = {
    total: updates.length,
    by_type: {
      with_replies: 0,
      by_system: 0,
      by_users: 0,
    },
    polling_active: forwarder.isPolling,
    seen_count: forwarder.seenCount,
  };

  for (const u of updates) {
    if (u.replies && u.replies.length > 0) {
      stats.by_type.with_replies++;
    }
    if (Number(u.creator_id) < 0) {
      stats.by_type.by_system++;
    } else {
      stats.by_type.by_users++;
    }
  }

  return stats;
}

export async function configureNotifications(
  _client: MondayClient,
  forwarder: NotificationForwarder,
  params: Static<typeof ConfigureNotificationsParams>
) {
  const results: string[] = [];

  if (params.enabled === false) {
    forwarder.stopPolling();
    results.push("Notification polling disabled.");
  } else if (params.enabled === true) {
    const interval = params.poll_interval_seconds
      ? Math.max(params.poll_interval_seconds, 10) * 1000
      : 60000;

    if (forwarder.isPolling) {
      forwarder.stopPolling();
    }
    await forwarder.startPolling(interval);
    results.push(
      `Notification polling enabled (every ${interval / 1000}s).`
    );
  } else if (params.poll_interval_seconds) {
    const interval = Math.max(params.poll_interval_seconds, 10) * 1000;
    if (forwarder.isPolling) {
      forwarder.stopPolling();
    }
    await forwarder.startPolling(interval);
    results.push(
      `Polling interval updated to ${interval / 1000}s.`
    );
  }

  if (results.length === 0) {
    results.push(
      `Current status: polling ${forwarder.isPolling ? "active" : "inactive"}, ${forwarder.seenCount} notifications tracked.`
    );
  }

  return {
    message: results.join(" "),
    polling_active: forwarder.isPolling,
    seen_count: forwarder.seenCount,
  };
}
