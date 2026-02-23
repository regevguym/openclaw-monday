/**
 * Advanced tools for monday.com - MCP passthrough
 * Tools: monday_raw_graphql, monday_get_schema
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";
import type { McpClient } from "../mcp-client.js";

// --- Schemas ---

export const RawGraphqlParams = Type.Object({
  query: Type.String({
    description:
      "Raw GraphQL query or mutation string. Use this for operations not covered by other tools.",
  }),
  variables: Type.Optional(
    Type.Record(Type.String(), Type.Any(), {
      description: "GraphQL variables as key-value pairs",
    })
  ),
});

export const GetSchemaParams = Type.Object({
  type_name: Type.Optional(
    Type.String({
      description:
        "Specific GraphQL type name to inspect (e.g. 'Board', 'Item', 'Column'). If omitted, returns the full schema overview.",
    })
  ),
});

// --- Tool Implementations ---

/**
 * Execute a raw GraphQL query/mutation.
 * Tries MCP passthrough first, falls back to direct client.
 */
export async function rawGraphql(
  client: MondayClient,
  mcpClient: McpClient | null,
  params: Static<typeof RawGraphqlParams>
) {
  // Prefer MCP passthrough for raw queries (supports dynamic schema features)
  if (mcpClient) {
    try {
      const result = await mcpClient.callTool("monday_raw_graphql", {
        query: params.query,
        variables: params.variables,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch {
      // Fall back to direct client
    }
  }

  const data = await client.query(params.query, params.variables);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Get monday.com GraphQL schema information.
 * Uses MCP passthrough if available, otherwise uses introspection query.
 */
export async function getSchema(
  client: MondayClient,
  mcpClient: McpClient | null,
  params: Static<typeof GetSchemaParams>
) {
  // Try MCP passthrough first
  if (mcpClient) {
    try {
      const result = await mcpClient.callTool("monday_get_schema", {
        type_name: params.type_name,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch {
      // Fall back to introspection
    }
  }

  // Direct introspection query
  if (params.type_name) {
    const data = await client.query(
      `
      query ($typeName: String!) {
        __type(name: $typeName) {
          name kind description
          fields {
            name description
            type { name kind ofType { name kind } }
            args { name description type { name kind ofType { name kind } } }
          }
          inputFields {
            name description
            type { name kind ofType { name kind } }
          }
          enumValues { name description }
        }
      }
      `,
      { typeName: params.type_name }
    );

    if (!data.__type) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Type "${params.type_name}" not found. Use without type_name to see available types.`,
          },
        ],
      };
    }

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(data.__type, null, 2) },
      ],
    };
  }

  // Full schema overview - list query and mutation types
  const data = await client.query(`
    query {
      __schema {
        queryType { name fields { name description } }
        mutationType { name fields { name description } }
        types {
          name kind description
        }
      }
    }
  `);

  // Filter out intrinsic types
  const userTypes = data.__schema.types.filter(
    (t: any) => !t.name.startsWith("__") && t.kind !== "SCALAR"
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            queries: data.__schema.queryType?.fields,
            mutations: data.__schema.mutationType?.fields,
            types: userTypes,
          },
          null,
          2
        ),
      },
    ],
  };
}
