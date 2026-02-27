/**
 * Notification Forwarder Integration
 * Polls monday.com notifications and enriches them with full context
 * for the OpenClaw AI agent to process.
 */

import { MondayClient } from "../monday-client.js";
import * as fs from "fs/promises";
import * as path from "path";

export interface EnrichedNotification {
  id: string;
  title: string;
  text: string;
  created_at: string;
  /** Enriched context from related item */
  relatedItem?: {
    id: number;
    name: string;
    board_name: string;
    board_id: number;
    column_values: any[];
    recent_updates: any[];
  };
  /** User who caused the notification */
  triggeredBy?: string;
  /** Direct link to item */
  itemUrl?: string;
  /** Direct link to board */
  boardUrl?: string;
}

interface NotificationState {
  seenIds: string[];
  lastPollTime: string;
}

const MAX_SEEN_IDS = 500;

export class NotificationForwarder {
  private client: MondayClient;
  private seenIds: Set<string> = new Set();
  private pollInterval?: ReturnType<typeof setInterval>;
  private statePath: string;
  private accountSlug?: string;

  /** Callback invoked for each new enriched notification */
  onNotification?: (notification: EnrichedNotification) => void;

  constructor(client: MondayClient) {
    this.client = client;
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || "/tmp";
    this.statePath = path.join(
      homeDir,
      ".openclaw",
      "monday-notifications-state.json"
    );
  }

  /**
   * Start polling for notifications at the given interval.
   */
  async startPolling(intervalMs = 60000): Promise<void> {
    await this.loadState();
    await this.resolveAccountSlug();

    // Run an initial poll immediately
    await this.pollNotifications();

    this.pollInterval = setInterval(async () => {
      try {
        await this.pollNotifications();
      } catch (error) {
        console.error("[monday-notifications] Poll error:", error);
      }
    }, intervalMs);

    console.log(
      `[monday-notifications] Polling started (every ${intervalMs / 1000}s)`
    );
  }

  /**
   * Stop the polling loop.
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
      console.log("[monday-notifications] Polling stopped");
    }
  }

  /**
   * Whether the forwarder is currently polling.
   */
  get isPolling(): boolean {
    return this.pollInterval !== undefined;
  }

  /**
   * Number of seen notification IDs being tracked.
   */
  get seenCount(): number {
    return this.seenIds.size;
  }

  /**
   * Run a single poll cycle: fetch notifications, filter new ones, enrich, and surface.
   */
  async pollNotifications(): Promise<EnrichedNotification[]> {
    const raw = await this.fetchNotifications();
    const newNotifications = raw.filter((n) => !this.seenIds.has(n.id));

    if (newNotifications.length === 0) return [];

    const enriched: EnrichedNotification[] = [];

    for (const notification of newNotifications) {
      this.markSeen(notification.id);
      try {
        const enrichedNotification =
          await this.enrichNotification(notification);
        enriched.push(enrichedNotification);

        if (this.onNotification) {
          this.onNotification(enrichedNotification);
        }
      } catch (error) {
        console.error(
          `[monday-notifications] Failed to enrich notification ${notification.id}:`,
          error
        );
        // Still surface the notification without enrichment
        const basic: EnrichedNotification = {
          id: notification.id,
          title: notification.title || "",
          text: notification.text || "",
          created_at: notification.created_at || "",
        };
        enriched.push(basic);
        if (this.onNotification) {
          this.onNotification(basic);
        }
      }
    }

    await this.saveState();
    return enriched;
  }

  /**
   * Fetch recent notifications from monday.com API.
   */
  private async fetchNotifications(limit = 25): Promise<any[]> {
    const data = await this.client.queryWithRetry(
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

    return data?.me?.notifications || [];
  }

  /**
   * Enrich a raw notification with full item/board context.
   */
  private async enrichNotification(
    notification: any
  ): Promise<EnrichedNotification> {
    const enriched: EnrichedNotification = {
      id: notification.id,
      title: notification.title || "",
      text: notification.text || "",
      created_at: notification.created_at || "",
    };

    // Try to extract an item ID from the notification text/title
    const itemId = this.extractItemId(notification);
    if (!itemId) return enriched;

    try {
      const data = await this.client.queryWithRetry(
        `query ($ids: [ID!]!) {
          items(ids: $ids) {
            id
            name
            board {
              id
              name
            }
            column_values {
              id
              title
              text
              value
            }
            updates(limit: 5) {
              id
              body
              created_at
              creator {
                id
                name
              }
            }
          }
        }`,
        { ids: [String(itemId)] }
      );

      const item = data?.items?.[0];
      if (item) {
        enriched.relatedItem = {
          id: Number(item.id),
          name: item.name,
          board_name: item.board?.name || "",
          board_id: Number(item.board?.id || 0),
          column_values: item.column_values || [],
          recent_updates: item.updates || [],
        };

        // Build URLs
        if (this.accountSlug && item.board?.id) {
          enriched.boardUrl = `https://${this.accountSlug}.monday.com/boards/${item.board.id}`;
          enriched.itemUrl = `${enriched.boardUrl}/pulses/${item.id}`;
        }

        // Extract who triggered the notification from the most recent update
        const latestUpdate = item.updates?.[0];
        if (latestUpdate?.creator?.name) {
          enriched.triggeredBy = latestUpdate.creator.name;
        }
      }
    } catch (error) {
      console.error(
        `[monday-notifications] Failed to fetch item ${itemId}:`,
        error
      );
    }

    return enriched;
  }

  /**
   * Try to extract an item/pulse ID from notification content.
   * monday.com notification text often contains item references.
   */
  private extractItemId(notification: any): string | null {
    const text = `${notification.title || ""} ${notification.text || ""}`;

    // Match patterns like "pulse-123456" or "item_id=123456"
    const pulseMatch = text.match(/pulse[_-]?(\d+)/i);
    if (pulseMatch) return pulseMatch[1];

    const itemIdMatch = text.match(/item[_-]?id[=:]?\s*(\d+)/i);
    if (itemIdMatch) return itemIdMatch[1];

    // Match patterns in URLs: /pulses/123456
    const urlMatch = text.match(/\/pulses\/(\d+)/);
    if (urlMatch) return urlMatch[1];

    return null;
  }

  /**
   * Resolve the account slug for building URLs.
   */
  private async resolveAccountSlug(): Promise<void> {
    try {
      const data = await this.client.queryWithRetry(
        `query { me { account { slug } } }`
      );
      this.accountSlug = data?.me?.account?.slug;
    } catch {
      // Non-critical, URLs just won't be generated
    }
  }

  /**
   * Mark a notification ID as seen, maintaining the cap.
   */
  private markSeen(id: string): void {
    this.seenIds.add(id);

    // Cap the set size to prevent unbounded growth
    if (this.seenIds.size > MAX_SEEN_IDS) {
      const entries = Array.from(this.seenIds);
      const toRemove = entries.slice(0, entries.length - MAX_SEEN_IDS);
      for (const old of toRemove) {
        this.seenIds.delete(old);
      }
    }
  }

  /**
   * Load persisted state from disk.
   */
  private async loadState(): Promise<void> {
    try {
      const content = await fs.readFile(this.statePath, "utf-8");
      const state: NotificationState = JSON.parse(content);
      this.seenIds = new Set(state.seenIds || []);
      console.log(
        `[monday-notifications] Loaded state: ${this.seenIds.size} seen IDs`
      );
    } catch {
      // No saved state — start fresh
      this.seenIds = new Set();
    }
  }

  /**
   * Persist state to disk.
   */
  private async saveState(): Promise<void> {
    try {
      const dir = path.dirname(this.statePath);
      await fs.mkdir(dir, { recursive: true });

      const state: NotificationState = {
        seenIds: Array.from(this.seenIds),
        lastPollTime: new Date().toISOString(),
      };

      await fs.writeFile(this.statePath, JSON.stringify(state, null, 2), "utf-8");
    } catch (error) {
      console.error("[monday-notifications] Failed to save state:", error);
    }
  }
}
