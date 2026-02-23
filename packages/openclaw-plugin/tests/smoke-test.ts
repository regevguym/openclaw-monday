/**
 * Live integration smoke test for monday.com API.
 *
 * Run manually with: MONDAY_API_TOKEN=<token> npx tsx tests/smoke-test.ts
 *
 * This test creates a board, adds items, reads them back, and cleans up.
 * Requires a valid monday.com API token with write access.
 */

import { MondayClient } from "../src/monday-client.js";
import * as boards from "../src/tools/boards.js";
import * as items from "../src/tools/items.js";
import * as groups from "../src/tools/groups.js";
import * as columns from "../src/tools/columns.js";
import * as updates from "../src/tools/updates.js";

const apiToken = process.env.MONDAY_API_TOKEN;
if (!apiToken) {
  console.error("Error: MONDAY_API_TOKEN environment variable is required.");
  console.error("Usage: MONDAY_API_TOKEN=<your-token> npx tsx tests/smoke-test.ts");
  process.exit(1);
}

const client = new MondayClient({ apiToken });

function parse(result: { content: Array<{ text: string }> }): any {
  return JSON.parse(result.content[0].text);
}

async function main() {
  let boardId: number | undefined;

  try {
    console.log("\n=== monday.com Smoke Test ===\n");

    // 1. List existing boards
    console.log("1. Listing boards...");
    const boardList = await boards.listBoards(client, { limit: 5 });
    const boardData = JSON.parse(boardList.content[0].text);
    console.log(`   Found ${boardData.length} boards`);

    // 2. Create a test board
    console.log("2. Creating test board...");
    const newBoard = await boards.createBoard(client, {
      board_name: `Smoke Test ${Date.now()}`,
      board_kind: "private",
      description: "Automated smoke test - safe to delete",
    });
    const boardInfo = parse(newBoard);
    boardId = parseInt(boardInfo.id);
    console.log(`   Created board: ${boardInfo.name} (ID: ${boardId})`);

    // 3. Get board details
    console.log("3. Getting board details...");
    const boardDetails = await boards.getBoard(client, { board_id: boardId });
    const details = parse(boardDetails);
    console.log(`   Board has ${details.columns?.length ?? 0} columns, ${details.groups?.length ?? 0} groups`);

    // 4. Create a group
    console.log("4. Creating a group...");
    const newGroup = await groups.createGroup(client, {
      board_id: boardId,
      group_name: "Test Group",
    });
    const groupInfo = parse(newGroup);
    console.log(`   Created group: ${groupInfo.title} (ID: ${groupInfo.id})`);

    // 5. Create a column
    console.log("5. Creating a status column...");
    const newColumn = await columns.createColumn(client, {
      board_id: boardId,
      title: "Priority",
      column_type: "status",
    });
    const colInfo = parse(newColumn);
    console.log(`   Created column: ${colInfo.title} (ID: ${colInfo.id})`);

    // 6. Create an item
    console.log("6. Creating an item...");
    const newItem = await items.createItem(client, {
      board_id: boardId,
      item_name: "Test Task",
      group_id: groupInfo.id,
      column_values: {
        [colInfo.id]: { label: "High" },
      },
      create_labels_if_missing: true,
    });
    const itemInfo = parse(newItem);
    const itemId = parseInt(itemInfo.id);
    console.log(`   Created item: ${itemInfo.name} (ID: ${itemId})`);

    // 7. Get items
    console.log("7. Getting items...");
    const itemList = await items.getItems(client, {
      board_id: boardId,
      limit: 10,
    });
    const itemsData = JSON.parse(itemList.content[0].text);
    console.log(`   Found ${itemsData.items?.length ?? 0} items`);

    // 8. Update item
    console.log("8. Updating item columns...");
    const updateResult = await items.updateItemColumns(client, {
      board_id: boardId,
      item_id: itemId,
      column_values: {
        [colInfo.id]: { label: "Critical" },
      },
      create_labels_if_missing: true,
    });
    console.log("   Updated successfully");

    // 9. Add a comment
    console.log("9. Adding a comment...");
    const comment = await updates.createUpdate(client, {
      item_id: itemId,
      body: "Automated smoke test comment",
    });
    const commentInfo = parse(comment);
    console.log(`   Added update (ID: ${commentInfo.id})`);

    // 10. Get column values
    console.log("10. Getting column values...");
    const colVals = await columns.getColumnValues(client, {
      item_id: itemId,
    });
    const colValsData = JSON.parse(colVals.content[0].text);
    console.log(`   Item has ${colValsData.column_values?.length ?? 0} column values`);

    // 11. Delete item
    console.log("11. Deleting item...");
    await items.deleteItem(client, { item_id: itemId });
    console.log("   Item deleted");

    // 12. Delete board
    console.log("12. Deleting test board...");
    await boards.deleteBoard(client, { board_id: boardId });
    boardId = undefined;
    console.log("   Board deleted");

    console.log("\n=== All smoke tests passed! ===\n");
  } catch (error) {
    console.error("\n=== Smoke test FAILED ===");
    console.error(error);

    // Cleanup: try to delete the board if it was created
    if (boardId) {
      console.log("\nCleaning up test board...");
      try {
        await boards.deleteBoard(client, { board_id: boardId });
        console.log("Test board cleaned up.");
      } catch {
        console.error(`Failed to clean up board ${boardId}. Delete it manually.`);
      }
    }

    process.exit(1);
  }
}

main();
