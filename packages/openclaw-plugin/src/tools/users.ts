/**
 * User & team tools for monday.com
 * Tools: monday_list_users_and_teams
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const ListUsersAndTeamsParams = Type.Object({
  kind: Type.Optional(
    Type.Union([Type.Literal("all"), Type.Literal("non_guests"), Type.Literal("guests"), Type.Literal("non_pending")], {
      description: "Filter users by kind (default: all)",
      default: "all",
    })
  ),
  limit: Type.Optional(Type.Number({ description: "Max users to return (default 50)", default: 50 })),
  page: Type.Optional(Type.Number({ description: "Page number (1-based)", default: 1 })),
  include_teams: Type.Optional(
    Type.Boolean({ description: "Also fetch teams (default: true)", default: true })
  ),
});

// --- Tool Implementations ---

export async function listUsersAndTeams(
  client: MondayClient,
  params: Static<typeof ListUsersAndTeamsParams>
) {
  const limit = params.limit ?? 50;
  const page = params.page ?? 1;
  const kind = params.kind ?? "all";
  const includeTeams = params.include_teams ?? true;

  const teamsQuery = includeTeams
    ? `
      teams {
        id name
        owners { id name }
        users { id name email }
      }
    `
    : "";

  const data = await client.query(`
    query {
      users(kind: ${kind}, limit: ${limit}, page: ${page}) {
        id name email
        title
        is_admin
        is_guest
        enabled
        account { id name }
        teams { id name }
        created_at
      }
      ${teamsQuery}
    }
  `);

  const result: Record<string, any> = { users: data.users };
  if (includeTeams && data.teams) {
    result.teams = data.teams;
  }

  return {
    content: [
      { type: "text" as const, text: JSON.stringify(result, null, 2) },
    ],
  };
}
