/**
 * File tools for monday.com
 * Tools: monday_add_file_to_column
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const AddFileToColumnParams = Type.Object({
  item_id: Type.Number({ description: "Item ID to add the file to" }),
  column_id: Type.String({ description: "File column ID on the board" }),
  file_url: Type.String({ description: "Public URL of the file to upload" }),
});

// --- Tool Implementations ---

export async function addFileToColumn(
  client: MondayClient,
  params: Static<typeof AddFileToColumnParams>
) {
  // monday.com file columns accept assets via the add_file_to_column mutation.
  // For URL-based uploads, we use the change_column_value approach with the file column format.
  const data = await client.query(
    `
    mutation ($itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(item_id: $itemId, column_id: $columnId, value: $value) {
        id name
      }
    }
    `,
    {
      itemId: params.item_id,
      columnId: params.column_id,
      value: JSON.stringify({ files: [{ url: params.file_url }] }),
    }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.change_column_value, null, 2),
      },
    ],
  };
}
