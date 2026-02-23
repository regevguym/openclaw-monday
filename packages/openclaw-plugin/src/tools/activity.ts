/**
 * Activity log tools for monday.com
 * Tools: monday_get_activity_log
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const GetActivityLogParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to get activity from" }),
  limit: Type.Optional(Type.Number({ description: "Max activity entries to return (default 25)", default: 25 })),
  from: Type.Optional(Type.String({ description: "Start date filter (ISO 8601 format, e.g. 2024-01-01T00:00:00Z)" })),
  to: Type.Optional(Type.String({ description: "End date filter (ISO 8601 format, e.g. 2024-01-31T23:59:59Z)" })),
  column_ids: Type.Optional(
    Type.Array(Type.String(), { description: "Filter by specific column IDs" })
  ),
  group_ids: Type.Optional(
    Type.Array(Type.String(), { description: "Filter by specific group IDs" })
  ),
  item_ids: Type.Optional(
    Type.Array(Type.Number(), { description: "Filter by specific item IDs" })
  ),
  user_ids: Type.Optional(
    Type.Array(Type.Number(), { description: "Filter by specific user IDs" })
  ),
});

// --- Tool Implementations ---

export async function getActivityLog(
  client: MondayClient,
  params: Static<typeof GetActivityLogParams>
) {
  const limit = params.limit ?? 25;

  const variables: Record<string, any> = {
    boardId: [String(params.board_id)],
  };

  // Build optional filters
  const filters: string[] = [];
  if (params.from) filters.push(`from: "${params.from}"`);
  if (params.to) filters.push(`to: "${params.to}"`);
  if (params.column_ids) {
    variables.columnIds = params.column_ids;
    filters.push(`column_ids: $columnIds`);
  }
  if (params.group_ids) {
    variables.groupIds = params.group_ids;
    filters.push(`group_ids: $groupIds`);
  }
  if (params.item_ids) {
    variables.itemIds = params.item_ids.map(String);
    filters.push(`item_ids: $itemIds`);
  }
  if (params.user_ids) {
    variables.userIds = params.user_ids.map(String);
    filters.push(`user_ids: $userIds`);
  }

  const filterStr = filters.length > 0 ? `, ${filters.join(", ")}` : "";

  // Build variable definitions
  const varDefs: string[] = ["$boardId: [ID!]!"];
  if (params.column_ids) varDefs.push("$columnIds: [String!]");
  if (params.group_ids) varDefs.push("$groupIds: [String!]");
  if (params.item_ids) varDefs.push("$itemIds: [ID!]");
  if (params.user_ids) varDefs.push("$userIds: [ID!]");

  const data = await client.query(
    `
    query (${varDefs.join(", ")}) {
      boards(ids: $boardId) {
        activity_logs(limit: ${limit}${filterStr}) {
          id
          event
          data
          entity
          user_id
          created_at
        }
      }
    }
    `,
    variables
  );

  const board = data.boards?.[0];
  if (!board) {
    return {
      content: [{ type: "text" as const, text: `Board ${params.board_id} not found.` }],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(board.activity_logs ?? [], null, 2),
      },
    ],
  };
}
