/**
 * Group tools for monday.com
 * Tools: monday_list_groups, monday_create_group, monday_move_item_to_group
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const ListGroupsParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to list groups from" }),
});

export const CreateGroupParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to create the group on" }),
  group_name: Type.String({ description: "Name for the new group" }),
  position: Type.Optional(
    Type.String({
      description: 'Position for the group: "top" to place at top, omit for default position',
    })
  ),
});

export const MoveItemToGroupParams = Type.Object({
  item_id: Type.Number({ description: "Item ID to move" }),
  group_id: Type.String({ description: "Target group ID" }),
});

// --- Tool Implementations ---

export async function listGroups(
  client: MondayClient,
  params: Static<typeof ListGroupsParams>
) {
  const data = await client.query(
    `
    query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        groups {
          id title color position
          items_page(limit: 0) {
            cursor
          }
        }
      }
    }
    `,
    { boardId: [String(params.board_id)] }
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
        text: JSON.stringify(board.groups, null, 2),
      },
    ],
  };
}

export async function createGroup(
  client: MondayClient,
  params: Static<typeof CreateGroupParams>
) {
  const variables: Record<string, any> = {
    boardId: params.board_id,
    groupName: params.group_name,
  };

  let varDefs = `$boardId: ID!, $groupName: String!`;
  let args = `board_id: $boardId, group_name: $groupName`;

  if (params.position === "top") {
    args += `, position_relative_method: before_at`;
  }

  const data = await client.query(
    `
    mutation (${varDefs}) {
      create_group(${args}) {
        id title color position
      }
    }
    `,
    variables
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.create_group, null, 2),
      },
    ],
  };
}

export async function moveItemToGroup(
  client: MondayClient,
  params: Static<typeof MoveItemToGroupParams>
) {
  const data = await client.query(
    `
    mutation ($itemId: ID!, $groupId: String!) {
      move_item_to_group(item_id: $itemId, group_id: $groupId) {
        id name
        group { id title }
      }
    }
    `,
    { itemId: params.item_id, groupId: params.group_id }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.move_item_to_group, null, 2),
      },
    ],
  };
}
