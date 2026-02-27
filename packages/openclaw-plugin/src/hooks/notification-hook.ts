/**
 * Notification Hook
 * Surfaces enriched monday.com notifications to the OpenClaw AI agent
 * for intelligent processing based on monday-soul.md rules.
 */

import type {
  EnrichedNotification,
  NotificationForwarder,
} from "../integrations/notification-forwarder.js";

export class NotificationHandler {
  private forwarder: NotificationForwarder;

  constructor(forwarder: NotificationForwarder) {
    this.forwarder = forwarder;

    // Wire up as the notification callback
    this.forwarder.onNotification = (notification) => {
      this.handleNewNotification(notification);
    };
  }

  /**
   * Format and surface an enriched notification to the OpenClaw agent.
   */
  handleNewNotification(notification: EnrichedNotification): void {
    const message = this.formatNotificationMessage(notification);
    console.log(message);
  }

  /**
   * Build a structured message for the agent from an enriched notification.
   */
  private formatNotificationMessage(
    notification: EnrichedNotification
  ): string {
    const lines: string[] = [];

    lines.push(`\n📬 New monday.com notification:`);
    lines.push(`Title: "${notification.title}"`);

    if (notification.triggeredBy) {
      lines.push(`From: ${notification.triggeredBy}`);
    }

    if (notification.relatedItem) {
      const item = notification.relatedItem;
      const statusCol = item.column_values.find(
        (c: any) =>
          c.id === "status" ||
          c.title?.toLowerCase() === "status"
      );
      const statusText = statusCol?.text ? ` (Status: ${statusCol.text})` : "";

      lines.push(
        `Context: Item "${item.name}" on board "${item.board_name}"${statusText}`
      );

      // Include most recent update for context
      const latestUpdate = item.recent_updates[0];
      if (latestUpdate) {
        const body = this.stripHtml(latestUpdate.body).slice(0, 200);
        const creator = latestUpdate.creator?.name || "Someone";
        lines.push(`Recent activity: ${creator} wrote "${body}"`);
      }
    }

    if (notification.text && !notification.relatedItem) {
      lines.push(`Details: ${notification.text}`);
    }

    if (notification.itemUrl) {
      lines.push(`→ Item: ${notification.itemUrl}`);
    } else if (notification.boardUrl) {
      lines.push(`→ Board: ${notification.boardUrl}`);
    }

    lines.push(``);
    lines.push(
      `Follow your monday-soul.md guidelines to decide how to handle this notification.`
    );
    lines.push(
      `Available actions: respond with monday_create_update, take action with monday tools, or message the user via their messaging gateway.`
    );

    return lines.join("\n");
  }

  /**
   * Strip HTML tags from update body text.
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}
