/**
 * Column tools for monday.com
 * Tools: monday_create_column, monday_get_column_values
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const CreateColumnParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to create the column on" }),
  title: Type.String({ description: "Title for the new column" }),
  column_type: Type.String({
    description:
      'Column type (e.g. "status", "text", "numbers", "date", "people", "timeline", "dropdown", "checkbox", "rating", "link", "email", "phone", "long_text", "color_picker", "tags", "world_clock", "country", "formula")',
  }),
  description: Type.Optional(Type.String({ description: "Column description" })),
  defaults: Type.Optional(
    Type.Record(Type.String(), Type.Any(), {
      description:
        "Default values/labels for the column (e.g. status labels). Passed as JSON to the defaults argument.",
    })
  ),
});

export const GetColumnValuesParams = Type.Object({
  item_id: Type.Number({ description: "Item ID to retrieve column values for" }),
});

// --- Tool Implementations ---

export async function createColumn(
  client: MondayClient,
  params: Static<typeof CreateColumnParams>
) {
  const variables: Record<string, any> = {
    boardId: params.board_id,
    title: params.title,
    columnType: params.column_type,
  };

  let varDefs = `$boardId: ID!, $title: String!, $columnType: ColumnType!`;
  let args = `board_id: $boardId, title: $title, column_type: $columnType`;

  if (params.description) {
    varDefs += `, $description: String`;
    args += `, description: $description`;
    variables.description = params.description;
  }

  if (params.defaults) {
    varDefs += `, $defaults: JSON`;
    args += `, defaults: $defaults`;
    variables.defaults = JSON.stringify(params.defaults);
  }

  const data = await client.query(
    `
    mutation (${varDefs}) {
      create_column(${args}) {
        id title type description settings_str
      }
    }
    `,
    variables
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.create_column, null, 2),
      },
    ],
  };
}

export async function getColumnValues(
  client: MondayClient,
  params: Static<typeof GetColumnValuesParams>
) {
  const data = await client.query(
    `
    query ($itemId: [ID!]!) {
      items(ids: $itemId) {
        id name
        column_values {
          id
          type
          text
          value
          column {
            settings_str
          }
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

  // Flatten column settings into each column_value for convenience
  const columnValues = item.column_values.map((cv: any) => ({
    id: cv.id,
    type: cv.type,
    text: cv.text,
    value: cv.value,
    settings_str: cv.column?.settings_str ?? null,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { item_id: item.id, item_name: item.name, column_values: columnValues },
          null,
          2
        ),
      },
    ],
  };
}
