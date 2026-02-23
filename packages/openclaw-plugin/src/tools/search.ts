/**
 * Search tool for monday.com
 * Tools: monday_search
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const SearchParams = Type.Object({
  query: Type.String({ description: "Search query string" }),
  limit: Type.Optional(Type.Number({ description: "Max results to return (default 25)", default: 25 })),
  board_ids: Type.Optional(
    Type.Array(Type.Number(), { description: "Limit search to specific board IDs" })
  ),
});

// --- Tool Implementations ---

export async function search(
  client: MondayClient,
  params: Static<typeof SearchParams>
) {
  const limit = params.limit ?? 25;

  // Search items by name using items_page_by_column_values for targeted search,
  // or use the boards query with items_page and query_params for broader search.
  // The monday.com API doesn't have a single "search everything" endpoint,
  // so we search items by name across boards.

  if (params.board_ids && params.board_ids.length > 0) {
    // Search within specific boards
    const data = await client.query(
      `
      query ($boardIds: [ID!]!, $query: String!) {
        boards(ids: $boardIds) {
          id name
          items_page(limit: ${limit}, query_params: { rules: [{ column_id: "name", compare_value: [$query] }], operator: or }) {
            items {
              id name
              group { id title }
              column_values { id type text value }
              board { id name }
            }
          }
        }
      }
      `,
      {
        boardIds: params.board_ids.map(String),
        query: params.query,
      }
    );

    const items = data.boards?.flatMap(
      (b: any) =>
        b.items_page?.items?.map((item: any) => ({
          ...item,
          board: { id: b.id, name: b.name },
        })) ?? []
    ) ?? [];

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ query: params.query, results: items }, null, 2),
        },
      ],
    };
  }

  // Global search: search boards by name + items by name
  const data = await client.query(
    `
    query {
      boards(limit: ${limit}) {
        id name description board_kind
        workspace { id name }
        items_count
      }
    }
    `
  );

  // Filter boards matching query (client-side filter since API doesn't support board name search directly)
  const queryLower = params.query.toLowerCase();
  const matchingBoards = (data.boards ?? []).filter(
    (b: any) =>
      b.name?.toLowerCase().includes(queryLower) ||
      b.description?.toLowerCase().includes(queryLower)
  );

  // Also search items using items_by_column_values if we have boards
  let matchingItems: any[] = [];
  if (matchingBoards.length > 0) {
    try {
      const itemData = await client.query(
        `
        query ($boardIds: [ID!]!) {
          boards(ids: $boardIds) {
            id name
            items_page(limit: ${Math.min(limit, 10)}, query_params: { rules: [{ column_id: "name", compare_value: ["${params.query}"] }], operator: or }) {
              items {
                id name
                group { id title }
              }
            }
          }
        }
        `,
        { boardIds: matchingBoards.slice(0, 5).map((b: any) => String(b.id)) }
      );
      matchingItems = itemData.boards?.flatMap(
        (b: any) =>
          b.items_page?.items?.map((item: any) => ({
            ...item,
            board: { id: b.id, name: b.name },
          })) ?? []
      ) ?? [];
    } catch {
      // Item search is best-effort
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            query: params.query,
            boards: matchingBoards,
            items: matchingItems,
          },
          null,
          2
        ),
      },
    ],
  };
}
