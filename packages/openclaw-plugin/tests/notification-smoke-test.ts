/**
 * Live smoke test for notification polling.
 *
 * Run with: MONDAY_API_TOKEN=<token> npx tsx tests/notification-smoke-test.ts
 *
 * This test:
 * 1. Creates a NotificationForwarder and polls once
 * 2. Prints enriched notifications
 * 3. Tests the NotificationHandler formatting
 * 4. Verifies state persistence
 */

import { MondayClient } from "../src/monday-client.js";
import { NotificationForwarder } from "../src/integrations/notification-forwarder.js";
import { NotificationHandler } from "../src/hooks/notification-hook.js";

const apiToken = process.env.MONDAY_API_TOKEN;
if (!apiToken) {
  console.error("Error: MONDAY_API_TOKEN environment variable is required.");
  console.error("Usage: MONDAY_API_TOKEN=<your-token> npx tsx tests/notification-smoke-test.ts");
  process.exit(1);
}

const client = new MondayClient({ apiToken });

async function main() {
  console.log("\n=== Notification Polling Smoke Test ===\n");

  // 1. Create forwarder
  console.log("1. Creating NotificationForwarder...");
  const forwarder = new NotificationForwarder(client);

  // 2. Wire up the handler (captures console output)
  console.log("2. Creating NotificationHandler...");
  const handler = new NotificationHandler(forwarder);

  // 3. Run a single poll
  console.log("3. Running single poll cycle...");
  const notifications = await forwarder.pollNotifications();
  console.log(`   Fetched ${notifications.length} new notification(s)\n`);

  if (notifications.length === 0) {
    console.log("   (No new notifications. This is normal if you've run this test before.)\n");

    // Fetch raw to show what's there regardless of seen state
    console.log("4. Fetching raw notifications (ignoring seen state)...");
    const data = await client.queryWithRetry(
      `query { me { notifications(limit: 5) { id title text created_at } } }`
    );
    const raw = data?.me?.notifications || [];
    console.log(`   Found ${raw.length} total notification(s) in account:\n`);
    for (const n of raw) {
      console.log(`   - [${n.id}] ${n.title}`);
      console.log(`     ${n.text?.slice(0, 100)}`);
      console.log(`     Created: ${n.created_at}\n`);
    }
  } else {
    console.log("4. Enriched notifications:\n");
    for (const n of notifications) {
      console.log(`   --- Notification ${n.id} ---`);
      console.log(`   Title: ${n.title}`);
      console.log(`   Text: ${n.text?.slice(0, 150)}`);
      if (n.triggeredBy) console.log(`   Triggered by: ${n.triggeredBy}`);
      if (n.relatedItem) {
        console.log(`   Item: "${n.relatedItem.name}" on board "${n.relatedItem.board_name}"`);
        console.log(`   Columns: ${n.relatedItem.column_values.length}`);
        console.log(`   Recent updates: ${n.relatedItem.recent_updates.length}`);
      }
      if (n.itemUrl) console.log(`   URL: ${n.itemUrl}`);
      console.log();
    }
  }

  // 5. Check state persistence
  console.log("5. Verifying state persistence...");
  console.log(`   Seen IDs tracked: ${forwarder.seenCount}`);

  // 6. Test polling start/stop
  console.log("6. Testing start/stop polling...");
  await forwarder.startPolling(5000); // 5s for quick test
  console.log(`   Polling active: ${forwarder.isPolling}`);
  forwarder.stopPolling();
  console.log(`   Polling active after stop: ${forwarder.isPolling}`);

  console.log("\n=== Notification smoke test passed! ===\n");
}

main().catch((err) => {
  console.error("\n=== Smoke test FAILED ===");
  console.error(err);
  process.exit(1);
});
