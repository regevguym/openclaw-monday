/**
 * Notification tools for monday.com
 * Tools: monday_get_notifications, monday_get_notification_stats, monday_configure_notifications
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
      me {
        notifications(limit: ${limit}) {
          id
          title
          text
          created_at
          updated_at
        }
      }
    }`
  );

  const notifications = data?.me?.notifications || [];

  return {
    notifications,
    count: notifications.length,
    polling_active: forwarder.isPolling,
    seen_count: forwarder.seenCount,
  };
}

export async function getNotificationStats(
  _client: MondayClient,
  forwarder: NotificationForwarder
) {
  // Fetch a batch to compute stats
  const data = await _client.queryWithRetry(
    `query {
      me {
        notifications(limit: 50) {
          id
          title
          text
          created_at
        }
      }
    }`
  );

  const notifications = data?.me?.notifications || [];

  // Classify notifications by type heuristic
  const stats = {
    total: notifications.length,
    by_type: {
      mention: 0,
      assignment: 0,
      status_change: 0,
      reply: 0,
      other: 0,
    },
    polling_active: forwarder.isPolling,
    seen_count: forwarder.seenCount,
  };

  for (const n of notifications) {
    const text = `${n.title || ""} ${n.text || ""}`.toLowerCase();
    if (text.includes("mentioned") || text.includes("@")) {
      stats.by_type.mention++;
    } else if (
      text.includes("assigned") ||
      text.includes("assignment")
    ) {
      stats.by_type.assignment++;
    } else if (
      text.includes("status") ||
      text.includes("changed") ||
      text.includes("moved")
    ) {
      stats.by_type.status_change++;
    } else if (
      text.includes("replied") ||
      text.includes("reply")
    ) {
      stats.by_type.reply++;
    } else {
      stats.by_type.other++;
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
