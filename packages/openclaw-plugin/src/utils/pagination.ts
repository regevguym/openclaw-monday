/**
 * Cursor-based pagination helper for monday.com API.
 *
 * monday.com uses cursor-based pagination for large result sets.
 * This module provides helpers to iterate through paginated results.
 */

import type { MondayClient } from "../monday-client.js";

export interface PaginatedResult<T> {
  items: T[];
  cursor: string | null;
}

export interface PaginationOptions {
  /** Maximum number of items to fetch across all pages. Default: no limit. */
  maxItems?: number;
  /** Items per page (API limit). Default: 50. */
  pageSize?: number;
}

/**
 * Fetch all pages of a paginated query using cursor-based pagination.
 *
 * The queryBuilder receives a cursor (null for first page) and page size,
 * and must return { query, variables } for the GraphQL call.
 *
 * The resultExtractor receives the API response and must return
 * { items, cursor } where cursor is null when no more pages exist.
 */
export async function fetchAllPages<T, R = any>(
  client: MondayClient,
  queryBuilder: (cursor: string | null, pageSize: number) => {
    query: string;
    variables?: Record<string, any>;
  },
  resultExtractor: (data: R) => PaginatedResult<T>,
  options: PaginationOptions = {}
): Promise<T[]> {
  const pageSize = options.pageSize ?? 50;
  const maxItems = options.maxItems ?? Infinity;
  const allItems: T[] = [];
  let cursor: string | null = null;

  do {
    const { query, variables } = queryBuilder(cursor, pageSize);
    const data = await client.query<R>(query, variables);
    const page = resultExtractor(data);

    allItems.push(...page.items);
    cursor = page.cursor;

    if (allItems.length >= maxItems) {
      return allItems.slice(0, maxItems);
    }
  } while (cursor);

  return allItems;
}

/**
 * Build a standard items_page query with cursor pagination.
 * Returns query + variables for use with fetchAllPages.
 */
export function itemsPageQuery(
  boardId: number | string,
  cursor: string | null,
  pageSize: number,
  queryParams?: string
): { query: string; variables: Record<string, any> } {
  if (cursor) {
    return {
      query: `
        query ($cursor: String!) {
          next_items_page(cursor: $cursor, limit: ${pageSize}) {
            cursor
            items {
              id
              name
              group { id title }
              column_values { id type text value }
              created_at
              updated_at
            }
          }
        }
      `,
      variables: { cursor },
    };
  }

  const queryArg = queryParams
    ? `, query_params: ${queryParams}`
    : "";

  return {
    query: `
      query ($boardId: [ID!]!) {
        boards(ids: $boardId) {
          items_page(limit: ${pageSize}${queryArg}) {
            cursor
            items {
              id
              name
              group { id title }
              column_values { id type text value }
              created_at
              updated_at
            }
          }
        }
      }
    `,
    variables: { boardId: [String(boardId)] },
  };
}

/**
 * Extract items and cursor from a standard items_page response.
 */
export function extractItemsPage(
  data: any,
  isNextPage: boolean
): PaginatedResult<any> {
  if (isNextPage) {
    const page = data.next_items_page;
    return {
      items: page?.items ?? [],
      cursor: page?.cursor ?? null,
    };
  }

  const board = data.boards?.[0];
  const page = board?.items_page;
  return {
    items: page?.items ?? [],
    cursor: page?.cursor ?? null,
  };
}
