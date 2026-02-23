/**
 * Subitem tools for monday.com
 * Tools: monday_get_subitems, monday_create_subitem, monday_update_subitem_columns
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";
import { formatColumnValues } from "../utils/column-values.js";

// --- Schemas ---

export const GetSubitemsParams = Type.Object({
  item_id: Type.Number({ description: "Parent item ID to get subitems from" }),
});

export const CreateSubitemParams = Type.Object({
  parent_item_id: Type.Number({ description: "Parent item ID to create the subitem under" }),
  item_name: Type.String({ description: "Name of the new subitem" }),
  column_values: Type.Optional(
    Type.Record(Type.String(), Type.Any(), {
      description:
        "Column values as { column_id: value } object. Subitems have their own column schema independent of the parent board.",
    })
  ),
  create_labels_if_missing: Type.Optional(
    Type.Boolean({ description: "Auto-create status/dropdown labels if they don't exist", default: false })
  ),
});

export const UpdateSubitemColumnsParams = Type.Object({
  board_id: Type.Number({ description: "Subitems board ID (not the parent board ID)" }),
  item_id: Type.Number({ description: "Subitem ID to update" }),
  column_values: Type.Record(Type.String(), Type.Any(), {
    description: "Column values to update as { column_id: value } object",
  }),
  create_labels_if_missing: Type.Optional(
    Type.Boolean({ description: "Auto-create status/dropdown labels if they don't exist", default: false })
  ),
});

// --- Tool Implementations ---

export async function getSubitems(
  client: MondayClient,
  params: Static<typeof GetSubitemsParams>
) {
  const data = await client.query(
    `
    query ($itemId: [ID!]!) {
      items(ids: $itemId) {
        id name
        subitems {
          id name
          board { id name }
          group { id title }
          column_values { id type text value }
          created_at updated_at
        }
      }
    }
    `,
    { itemId: [String(params.item_id)] }
  );

  const item = data.items?.[0];
  if (!item) {
    return {
      content: [{ type: "text" as const, text: `Item ${params.item_id} not found.` }],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { parent_item: { id: item.id, name: item.name }, subitems: item.subitems ?? [] },
          null,
          2
        ),
      },
    ],
  };
}

export async function createSubitem(
  client: MondayClient,
  params: Static<typeof CreateSubitemParams>
) {
  const variables: Record<string, any> = {
    parentItemId: params.parent_item_id,
    itemName: params.item_name,
  };

  let args = `parent_item_id: $parentItemId, item_name: $itemName`;
  let varDefs = `$parentItemId: ID!, $itemName: String!`;

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
      create_subitem(${args}) {
        id name
        board { id name }
        column_values { id type text value }
      }
    }
    `,
    variables
  );

  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data.create_subitem, null, 2) },
    ],
  };
}

export async function updateSubitemColumns(
  client: MondayClient,
  params: Static<typeof UpdateSubitemColumnsParams>
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
