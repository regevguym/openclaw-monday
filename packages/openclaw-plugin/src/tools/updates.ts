/**
 * Update/comment tools for monday.com
 * Tools: monday_create_update, monday_get_updates, monday_reply_to_update
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const CreateUpdateParams = Type.Object({
  item_id: Type.Number({ description: "The item ID to post an update/comment on" }),
  body: Type.String({ description: "The update/comment text (supports HTML)" }),
});

export const GetUpdatesParams = Type.Object({
  item_id: Type.Number({ description: "The item ID to get updates for" }),
  limit: Type.Optional(Type.Number({ description: "Max updates to return (default 25)", default: 25 })),
});

export const ReplyToUpdateParams = Type.Object({
  update_id: Type.Number({ description: "The update ID to reply to" }),
  body: Type.String({ description: "The reply text (supports HTML)" }),
});

// --- Tool Implementations ---

export async function createUpdate(
  client: MondayClient,
  params: Static<typeof CreateUpdateParams>
) {
  const data = await client.query(
    `
    mutation ($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) {
        id
        body
        creator { id name }
        created_at
      }
    }
    `,
    { itemId: params.item_id, body: params.body }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.create_update, null, 2),
      },
    ],
  };
}

export async function getUpdates(
  client: MondayClient,
  params: Static<typeof GetUpdatesParams>
) {
  const limit = params.limit ?? 25;

  const data = await client.query(
    `
    query ($itemId: [ID!]!) {
      items(ids: $itemId) {
        updates(limit: ${limit}) {
          id
          body
          creator { id name }
          created_at
          replies {
            id
            body
            creator { id name }
            created_at
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

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(item.updates, null, 2),
      },
    ],
  };
}

export async function replyToUpdate(
  client: MondayClient,
  params: Static<typeof ReplyToUpdateParams>
) {
  const data = await client.query(
    `
    mutation ($updateId: ID!, $body: String!) {
      create_update(parent_id: $updateId, body: $body) {
        id
        body
        creator { id name }
        created_at
      }
    }
    `,
    { updateId: params.update_id, body: params.body }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.create_update, null, 2),
      },
    ],
  };
}
