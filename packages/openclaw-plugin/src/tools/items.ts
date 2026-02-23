/**
 * Item CRUD tools for monday.com
 * Tools: monday_get_items, monday_create_item, monday_update_item_columns,
 *        monday_move_item, monday_delete_item
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";
import { formatColumnValues } from "../utils/column-values.js";
import {
  fetchAllPages,
  itemsPageQuery,
  extractItemsPage,
} from "../utils/pagination.js";

// --- Schemas ---

export const GetItemsParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to get items from" }),
  limit: Type.Optional(Type.Number({ description: "Max items to return (default 50)", default: 50 })),
  group_id: Type.Optional(Type.String({ description: "Filter by group ID" })),
  column_id: Type.Optional(Type.String({ description: "Filter by column ID (used with column_value)" })),
  column_value: Type.Optional(Type.String({ description: "Filter by column value (used with column_id)" })),
  cursor: Type.Optional(Type.String({ description: "Pagination cursor from previous response" })),
});

export const CreateItemParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to create the item in" }),
  item_name: Type.String({ description: "Name of the new item" }),
  group_id: Type.Optional(Type.String({ description: "Group ID to place the item in" })),
  column_values: Type.Optional(
    Type.Record(Type.String(), Type.Any(), {
      description: "Column values as { column_id: value } object. See skill file for format per column type.",
    })
  ),
  create_labels_if_missing: Type.Optional(
    Type.Boolean({ description: "Auto-create status/dropdown labels if they don't exist", default: false })
  ),
});

export const UpdateItemColumnsParams = Type.Object({
  board_id: Type.Number({ description: "Board ID containing the item" }),
  item_id: Type.Number({ description: "Item ID to update" }),
  column_values: Type.Record(Type.String(), Type.Any(), {
    description: "Column values to update as { column_id: value } object",
  }),
  create_labels_if_missing: Type.Optional(
    Type.Boolean({ description: "Auto-create status/dropdown labels if they don't exist", default: false })
  ),
});

export const MoveItemParams = Type.Object({
  item_id: Type.Number({ description: "Item ID to move" }),
  board_id: Type.Number({ description: "Target board ID" }),
  group_id: Type.String({ description: "Target group ID" }),
});

export const DeleteItemParams = Type.Object({
  item_id: Type.Number({ description: "Item ID to delete" }),
});

// --- Tool Implementations ---

export async function getItems(
  client: MondayClient,
  params: Static<typeof GetItemsParams>
) {
  const limit = params.limit ?? 50;

  // If a cursor is provided, use next_items_page
  if (params.cursor) {
    const data = await client.query(
      `
      query ($cursor: String!) {
        next_items_page(cursor: $cursor, limit: ${limit}) {
          cursor
          items {
            id name
            group { id title }
            column_values { id type text value }
            created_at updated_at
          }
        }
      }
      `,
      { cursor: params.cursor }
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              items: data.next_items_page.items,
              cursor: data.next_items_page.cursor,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Build query_params for filtering
  let queryParams: string | undefined;
  if (params.column_id && params.column_value) {
    queryParams = `{ rules: [{ column_id: "${params.column_id}", compare_value: ["${params.column_value}"] }] }`;
  }

  // First page query
  const { query, variables } = itemsPageQuery(
    params.board_id,
    null,
    limit,
    queryParams
  );

  // Add group filter if specified
  let finalQuery = query;
  if (params.group_id) {
    finalQuery = `
      query ($boardId: [ID!]!) {
        boards(ids: $boardId) {
          groups(ids: ["${params.group_id}"]) {
            id title
            items_page(limit: ${limit}${queryParams ? `, query_params: ${queryParams}` : ""}) {
              cursor
              items {
                id name
                group { id title }
                column_values { id type text value }
                created_at updated_at
              }
            }
          }
        }
      }
    `;
  }

  const data = await client.query(finalQuery, variables);

  let result: any;
  if (params.group_id) {
    const group = data.boards?.[0]?.groups?.[0];
    result = {
      group: { id: group?.id, title: group?.title },
      items: group?.items_page?.items ?? [],
      cursor: group?.items_page?.cursor ?? null,
    };
  } else {
    const page = data.boards?.[0]?.items_page;
    result = {
      items: page?.items ?? [],
      cursor: page?.cursor ?? null,
    };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

export async function createItem(
  client: MondayClient,
  params: Static<typeof CreateItemParams>
) {
  const variables: Record<string, any> = {
    boardId: params.board_id,
    itemName: params.item_name,
  };

  let args = `board_id: $boardId, item_name: $itemName`;
  let varDefs = `$boardId: ID!, $itemName: String!`;

  if (params.group_id) {
    args += `, group_id: $groupId`;
    varDefs += `, $groupId: String`;
    variables.groupId = params.group_id;
  }

  if (params.column_values && Object.keys(params.column_values).length > 0) {
    args += `, column_values: $colVals`;
    varDefs += `, $colVals: JSON`;
    variables.colVals = formatColumnValues(params.column_values);
  }

  if (params.create_labels_if_missing) {
    args += `, create_labels_if_missing: true`;
  }

  const data = await client.query(
    `
    mutation (${varDefs}) {
      create_item(${args}) {
        id name
        group { id title }
        column_values { id type text value }
      }
    }
    `,
    variables
  );

  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data.create_item, null, 2) },
    ],
  };
}

export async function updateItemColumns(
  client: MondayClient,
  params: Static<typeof UpdateItemColumnsParams>
) {
  const variables: Record<string, any> = {
    boardId: params.board_id,
    itemId: params.item_id,
    colVals: formatColumnValues(params.column_values),
  };

  let args = `board_id: $boardId, item_id: $itemId, column_values: $colVals`;
  if (params.create_labels_if_missing) {
    args += `, create_labels_if_missing: true`;
  }

  const data = await client.query(
    `
    mutation ($boardId: ID!, $itemId: ID!, $colVals: JSON!) {
      change_multiple_column_values(${args}) {
        id name
        column_values { id type text value }
      }
    }
    `,
    variables
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.change_multiple_column_values, null, 2),
      },
    ],
  };
}

export async function moveItem(
  client: MondayClient,
  params: Static<typeof MoveItemParams>
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

export async function deleteItem(
  client: MondayClient,
  params: Static<typeof DeleteItemParams>
) {
  const data = await client.query(
    `
    mutation ($itemId: ID!) {
      delete_item(item_id: $itemId) {
        id
      }
    }
    `,
    { itemId: params.item_id }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: `Item ${data.delete_item.id} deleted successfully.`,
      },
    ],
  };
}
