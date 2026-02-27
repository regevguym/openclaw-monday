/**
 * Notification Forwarder Integration
 * Polls monday.com updates and surfaces relevant ones (mentions, replies, etc.)
 * with full context for the OpenClaw AI agent to process.
 *
 * Uses the `updates` top-level query since the monday.com API v2024-10
 * does not expose a `notifications` field.
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

interface CurrentUser {
  id: string;
  name: string;
}

const MAX_SEEN_IDS = 500;

export class NotificationForwarder {
  private client: MondayClient;
  private seenIds: Set<string> = new Set();
  private pollInterval?: ReturnType<typeof setInterval>;
  private statePath: string;
  private accountSlug?: string;
  private currentUser?: CurrentUser;

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
    await this.resolveCurrentUser();

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
   * Run a single poll cycle: fetch updates, filter for relevant + unseen, and surface.
   */
  async pollNotifications(): Promise<EnrichedNotification[]> {
    const raw = await this.fetchUpdates();

    // Filter: only unseen updates that are relevant to the current user
    const relevant = raw.filter((u) => {
      if (this.seenIds.has(u.id)) return false;
      return this.isRelevantToUser(u);
    });

    if (relevant.length === 0) return [];

    const enriched: EnrichedNotification[] = [];

    for (const update of relevant) {
      this.markSeen(update.id);
      const notification = this.mapUpdateToNotification(update);
      enriched.push(notification);

      if (this.onNotification) {
        this.onNotification(notification);
      }
    }

    await this.saveState();
    return enriched;
  }

  /**
   * Fetch recent updates from monday.com with item context included.
   */
  private async fetchUpdates(limit = 25): Promise<any[]> {
    const data = await this.client.queryWithRetry(
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
            column_values {
              id
              type
              text
            }
          }
          replies {
            id
            text_body
            creator_id
            creator { id name }
            created_at
          }
        }
      }`
    );

    return data?.updates || [];
  }

  /**
   * Determine if an update is relevant to the current user.
   * Relevant means: mentions the user by name, is a reply to the user's update,
   * or is by someone else on an item the user is involved with.
   */
  private isRelevantToUser(update: any): boolean {
    if (!this.currentUser) return true; // Can't filter without user info

    const userId = this.currentUser.id;
    const userName = this.currentUser.name;

    // Skip updates created by the current user (they already know)
    if (String(update.creator_id) === String(userId)) return false;

    // Check if the update text mentions the user by name
    const text = (update.text_body || update.body || "").toLowerCase();
    if (userName && text.includes(userName.toLowerCase())) return true;

    // Check if any reply on this update is by the current user
    // (meaning someone posted on a thread the user participated in)
    const replies = update.replies || [];
    const userReplied = replies.some(
      (r: any) => String(r.creator_id) === String(userId)
    );
    if (userReplied) return true;

    // Default: include all updates by others (the agent can further filter)
    return true;
  }

  /**
   * Map a raw update (with embedded item context) to an EnrichedNotification.
   */
  private mapUpdateToNotification(update: any): EnrichedNotification {
    const item = update.item;
    const creatorName = update.creator?.name || "Someone";
    const textBody = update.text_body || this.stripHtml(update.body || "");

    // Build a human-readable title
    const itemName = item?.name || "an item";
    const boardName = item?.board?.name || "";
    const title = boardName
      ? `${creatorName} posted on "${itemName}" (${boardName})`
      : `${creatorName} posted on "${itemName}"`;

    const notification: EnrichedNotification = {
      id: update.id,
      title,
      text: textBody,
      created_at: update.created_at || "",
      triggeredBy: creatorName,
    };

    if (item) {
      notification.relatedItem = {
        id: Number(item.id),
        name: item.name || "",
        board_name: item.board?.name || "",
        board_id: Number(item.board?.id || 0),
        column_values: item.column_values || [],
        recent_updates: (update.replies || []).map((r: any) => ({
          id: r.id,
          body: r.text_body || "",
          created_at: r.created_at,
          creator: r.creator,
        })),
      };

      // Build URLs
      if (this.accountSlug && item.board?.id) {
        notification.boardUrl = `https://${this.accountSlug}.monday.com/boards/${item.board.id}`;
        notification.itemUrl = `${notification.boardUrl}/pulses/${item.id}`;
      }
    }

    return notification;
  }

  /**
   * Resolve the current user ID/name and account slug.
   */
  private async resolveCurrentUser(): Promise<void> {
    try {
      const data = await this.client.queryWithRetry(
        `query { me { id name account { slug } } }`
      );
      if (data?.me) {
        this.currentUser = { id: data.me.id, name: data.me.name };
        this.accountSlug = data.me.account?.slug;
      }
    } catch {
      // Non-critical — filtering just won't exclude own updates
    }
  }

  /**
   * Strip HTML tags from text.
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * Mark a notification ID as seen, maintaining the cap.
   */
  private markSeen(id: string): void {
    this.seenIds.add(id);

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
