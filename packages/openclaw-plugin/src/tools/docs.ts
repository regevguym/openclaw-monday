/**
 * Document tools for monday.com
 * Tools: monday_list_docs, monday_create_doc, monday_read_doc
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const ListDocsParams = Type.Object({
  workspace_id: Type.Optional(Type.Number({ description: "Filter by workspace ID" })),
  limit: Type.Optional(Type.Number({ description: "Max docs to return (default 25)", default: 25 })),
});

export const CreateDocParams = Type.Object({
  workspace_id: Type.Number({ description: "Workspace ID to create the doc in" }),
  title: Type.String({ description: "Title of the new document" }),
  content: Type.String({ description: "Document body content in markdown" }),
});

export const ReadDocParams = Type.Object({
  doc_id: Type.Number({ description: "The document ID to read" }),
});

// --- Tool Implementations ---

export async function listDocs(
  client: MondayClient,
  params: Static<typeof ListDocsParams>
) {
  const limit = params.limit ?? 25;

  let query: string;
  let variables: Record<string, any> | undefined;

  if (params.workspace_id) {
    query = `
      query ($wsId: ID!, $limit: Int!) {
        docs(workspace_ids: [$wsId], limit: $limit) {
          id
          title
          created_at
          created_by { id name }
          workspace { id name }
        }
      }
    `;
    variables = { wsId: params.workspace_id, limit };
  } else {
    query = `
      query ($limit: Int!) {
        docs(limit: $limit) {
          id
          title
          created_at
          created_by { id name }
          workspace { id name }
        }
      }
    `;
    variables = { limit };
  }

  const data = await client.query(query, variables);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.docs, null, 2),
      },
    ],
  };
}

export async function createDoc(
  client: MondayClient,
  params: Static<typeof CreateDocParams>
) {
  const data = await client.query(
    `
    mutation ($wsId: ID!, $title: String!, $content: String!) {
      create_doc(
        location: { workspace: { workspace_id: $wsId } }
        title: $title
        content: $content
      ) {
        id
        title
        created_at
        created_by { id name }
        workspace { id name }
      }
    }
    `,
    {
      wsId: params.workspace_id,
      title: params.title,
      content: params.content,
    }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.create_doc, null, 2),
      },
    ],
  };
}

export async function readDoc(
  client: MondayClient,
  params: Static<typeof ReadDocParams>
) {
  const data = await client.query(
    `
    query ($docId: [ID!]!) {
      docs(ids: $docId) {
        id
        title
        blocks {
          id
          type
          content
        }
      }
    }
    `,
    { docId: [String(params.doc_id)] }
  );

  const doc = data.docs?.[0];
  if (!doc) {
    return {
      content: [{ type: "text" as const, text: `Document ${params.doc_id} not found.` }],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(doc, null, 2),
      },
    ],
  };
}
