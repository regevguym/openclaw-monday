/**
 * Automation/webhook tools for monday.com
 * Tools: monday_list_webhooks, monday_create_webhook
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const ListWebhooksParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to list webhooks for" }),
});

export const CreateWebhookParams = Type.Object({
  board_id: Type.Number({ description: "Board ID to create the webhook on" }),
  url: Type.String({ description: "URL to receive webhook POST requests" }),
  event: Type.Union(
    [
      Type.Literal("change_column_value"),
      Type.Literal("change_status_column_value"),
      Type.Literal("change_specific_column_value"),
      Type.Literal("create_item"),
      Type.Literal("delete_item"),
      Type.Literal("create_update"),
      Type.Literal("create_subitem"),
      Type.Literal("change_subitem_column_value"),
    ],
    {
      description: "The event type that triggers the webhook",
    }
  ),
  config: Type.Optional(
    Type.Record(Type.String(), Type.Any(), {
      description:
        'Optional webhook configuration (e.g., { "columnId": "status" } for change_specific_column_value)',
    })
  ),
});

// --- Tool Implementations ---

export async function listWebhooks(
  client: MondayClient,
  params: Static<typeof ListWebhooksParams>
) {
  const data = await client.query(
    `
    query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id name
        webhooks {
          id board_id event config
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
        text: JSON.stringify(board.webhooks ?? [], null, 2),
      },
    ],
  };
}

export async function createWebhook(
  client: MondayClient,
  params: Static<typeof CreateWebhookParams>
) {
  const variables: Record<string, any> = {
    boardId: params.board_id,
    url: params.url,
  };

  let configArg = "";
  if (params.config) {
    configArg = `, config: $config`;
    variables.config = JSON.stringify(params.config);
  }

  const data = await client.query(
    `
    mutation ($boardId: ID!, $url: String!${params.config ? ", $config: JSON" : ""}) {
      create_webhook(board_id: $boardId, url: $url, event: ${params.event}${configArg}) {
        id board_id
      }
    }
    `,
    variables
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.create_webhook, null, 2),
      },
    ],
  };
}
