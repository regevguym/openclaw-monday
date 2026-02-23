/**
 * Workspace tools for monday.com
 * Tools: monday_list_workspaces, monday_create_workspace
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const ListWorkspacesParams = Type.Object({
  limit: Type.Optional(Type.Number({ description: "Max workspaces to return (default 25)", default: 25 })),
  page: Type.Optional(Type.Number({ description: "Page number (1-based)", default: 1 })),
  kind: Type.Optional(
    Type.Union([Type.Literal("open"), Type.Literal("closed")], {
      description: "Filter by workspace kind",
    })
  ),
});

export const CreateWorkspaceParams = Type.Object({
  name: Type.String({ description: "Workspace name" }),
  kind: Type.Optional(
    Type.Union([Type.Literal("open"), Type.Literal("closed")], {
      description: "Workspace visibility (default: open)",
      default: "open",
    })
  ),
  description: Type.Optional(Type.String({ description: "Workspace description" })),
});

// --- Tool Implementations ---

export async function listWorkspaces(
  client: MondayClient,
  params: Static<typeof ListWorkspacesParams>
) {
  const limit = params.limit ?? 25;
  const page = params.page ?? 1;

  let args = `limit: ${limit}, page: ${page}`;
  if (params.kind) args += `, kind: ${params.kind}`;

  const data = await client.query(`
    query {
      workspaces(${args}) {
        id name kind description
        owners_subscribers { id name email }
        created_at
      }
    }
  `);

  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data.workspaces, null, 2) },
    ],
  };
}

export async function createWorkspace(
  client: MondayClient,
  params: Static<typeof CreateWorkspaceParams>
) {
  const kind = params.kind ?? "open";
  const variables: Record<string, any> = { name: params.name };
  let varDefs = `$name: String!`;
  let args = `name: $name, kind: ${kind}`;

  if (params.description) {
    args += `, description: $desc`;
    varDefs += `, $desc: String`;
    variables.desc = params.description;
  }

  const data = await client.query(
    `
    mutation (${varDefs}) {
      create_workspace(${args}) {
        id name kind description
      }
    }
    `,
    variables
  );

  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data.create_workspace, null, 2) },
    ],
  };
}
