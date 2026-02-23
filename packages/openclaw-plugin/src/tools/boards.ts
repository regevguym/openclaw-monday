/**
 * Board CRUD tools for monday.com
 * Tools: monday_list_boards, monday_get_board, monday_create_board, monday_delete_board
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const ListBoardsParams = Type.Object({
  limit: Type.Optional(Type.Number({ description: "Max boards to return (default 25)", default: 25 })),
  page: Type.Optional(Type.Number({ description: "Page number (1-based)", default: 1 })),
  workspace_id: Type.Optional(Type.Number({ description: "Filter by workspace ID" })),
  board_kind: Type.Optional(
    Type.Union([Type.Literal("public"), Type.Literal("private"), Type.Literal("share")], {
      description: "Filter by board kind",
    })
  ),
});

export const GetBoardParams = Type.Object({
  board_id: Type.Number({ description: "The board ID to retrieve" }),
});

export const CreateBoardParams = Type.Object({
  board_name: Type.String({ description: "Name for the new board" }),
  board_kind: Type.Optional(
    Type.Union([Type.Literal("public"), Type.Literal("private"), Type.Literal("share")], {
      description: "Board visibility (default: public)",
      default: "public",
    })
  ),
  workspace_id: Type.Optional(Type.Number({ description: "Workspace to create the board in" })),
  template_id: Type.Optional(Type.Number({ description: "Template board ID to clone from" })),
  description: Type.Optional(Type.String({ description: "Board description" })),
});

export const DeleteBoardParams = Type.Object({
  board_id: Type.Number({ description: "The board ID to delete" }),
});

// --- Tool Implementations ---

export async function listBoards(
  client: MondayClient,
  params: Static<typeof ListBoardsParams>
) {
  const limit = params.limit ?? 25;
  const page = params.page ?? 1;

  let args = `limit: ${limit}, page: ${page}`;
  if (params.board_kind) args += `, board_kind: ${params.board_kind}`;

  let boardsQuery: string;
  if (params.workspace_id) {
    boardsQuery = `
      query ($wsId: [ID!]) {
        boards(${args}, workspace_ids: $wsId) {
          id name description board_kind state
          workspace { id name }
          columns { id title type }
          groups { id title }
          owners { id name }
          items_count
        }
      }
    `;
  } else {
    boardsQuery = `
      query {
        boards(${args}) {
          id name description board_kind state
          workspace { id name }
          columns { id title type }
          groups { id title }
          owners { id name }
          items_count
        }
      }
    `;
  }

  const data = await client.query(
    boardsQuery,
    params.workspace_id ? { wsId: [String(params.workspace_id)] } : undefined
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.boards, null, 2),
      },
    ],
  };
}

export async function getBoard(
  client: MondayClient,
  params: Static<typeof GetBoardParams>
) {
  const data = await client.query(
    `
    query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id name description board_kind state
        workspace { id name }
        columns { id title type settings_str }
        groups { id title color position }
        owners { id name email }
        subscribers { id name email }
        items_count
        permissions
        updated_at
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
    content: [{ type: "text" as const, text: JSON.stringify(board, null, 2) }],
  };
}

export async function createBoard(
  client: MondayClient,
  params: Static<typeof CreateBoardParams>
) {
  const kind = params.board_kind ?? "public";
  let args = `board_name: $name, board_kind: ${kind}`;
  const variables: Record<string, any> = { name: params.board_name };

  if (params.workspace_id) {
    args += `, workspace_id: $wsId`;
    variables.wsId = params.workspace_id;
  }
  if (params.template_id) {
    args += `, template_id: $tmplId`;
    variables.tmplId = params.template_id;
  }
  if (params.description) {
    args += `, description: $desc`;
    variables.desc = params.description;
  }

  const data = await client.query(
    `
    mutation ($name: String!${params.workspace_id ? ", $wsId: ID" : ""}${params.template_id ? ", $tmplId: ID" : ""}${params.description ? ", $desc: String" : ""}) {
      create_board(${args}) {
        id name board_kind
        workspace { id name }
      }
    }
    `,
    variables
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.create_board, null, 2),
      },
    ],
  };
}

export async function deleteBoard(
  client: MondayClient,
  params: Static<typeof DeleteBoardParams>
) {
  const data = await client.query(
    `
    mutation ($boardId: ID!) {
      delete_board(board_id: $boardId) {
        id
      }
    }
    `,
    { boardId: params.board_id }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: `Board ${data.delete_board.id} deleted successfully.`,
      },
    ],
  };
}
