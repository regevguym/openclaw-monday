/**
 * OpenClaw Plugin for monday.com
 *
 * Entry point that registers all 34 tools with the OpenClaw plugin API.
 * Provides comprehensive monday.com management capabilities for AI agents.
 */

import { MondayClient } from "./monday-client.js";
import { McpClient } from "./mcp-client.js";

// Tool modules
import * as boards from "./tools/boards.js";
import * as items from "./tools/items.js";
import * as columns from "./tools/columns.js";
import * as groups from "./tools/groups.js";
import * as updates from "./tools/updates.js";
import * as docs from "./tools/docs.js";
import * as workspaces from "./tools/workspaces.js";
import * as users from "./tools/users.js";
import * as searchModule from "./tools/search.js";
import * as advanced from "./tools/advanced.js";
import * as subitems from "./tools/subitems.js";
import * as automations from "./tools/automations.js";
import * as activity from "./tools/activity.js";
import * as files from "./tools/files.js";
import * as account from "./tools/account.js";

export interface PluginConfig {
  /** monday.com API token */
  apiToken: string;
  /** Optional workspace ID to scope operations */
  workspaceId?: number;
  /** Optional MCP server URL override */
  mcpServerUrl?: string;
  /** Enable MCP passthrough for advanced tools (default: true) */
  enableMcp?: boolean;
}

/**
 * Register all monday.com tools with the OpenClaw plugin API.
 */
export function register(api: any) {
  const rawConfig = (api.pluginConfig && typeof api.pluginConfig === "object") ? api.pluginConfig as Record<string, unknown> : {};
  const config: PluginConfig = {
    apiToken: (rawConfig.apiToken as string) ?? process.env.MONDAY_API_TOKEN,
    workspaceId: rawConfig.workspaceId as number | undefined,
    mcpServerUrl: rawConfig.mcpServerUrl as string | undefined,
    enableMcp: rawConfig.enableMcp !== false,
  };

  const tokenMissing = !config.apiToken;

  const client = tokenMissing ? null : new MondayClient({
    apiToken: config.apiToken!,
  });

  let mcpClient: McpClient | null = null;
  if (!tokenMissing && config.enableMcp) {
    mcpClient = new McpClient({
      apiToken: config.apiToken!,
      serverUrl: config.mcpServerUrl,
    });
  }

  const TOKEN_SETUP_MSG = `🦙 **monday.com API token not configured!**

To use monday.com tools, you need to set up your API token:

**Option 1 — Config:**
Set it in your OpenClaw config under plugins.entries.monday-com.config.apiToken

**Option 2 — Environment variable:**
export MONDAY_API_TOKEN="your-token-here"

**Where to get your token:**
1. Go to monday.com
2. Click your Avatar (bottom-left)
3. Go to Developers → My Access Tokens
4. Copy your API token

Once set, restart the gateway and all 34 monday.com tools will be ready! 🚀`;

  function requireToken(): string {
    if (tokenMissing || !client) {
      return TOKEN_SETUP_MSG;
    }
    return "";
  }

  /** Format a result as a tool response */
  function toolResult(data: any) {
    if (typeof data === "string") {
      return { content: [{ type: "text", text: data }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }

  /** Wrap a tool executor to check for token first */
  function guarded(fn: (client: MondayClient, params: any) => Promise<any>) {
    return async (_id: string, params: any) => {
      const msg = requireToken();
      if (msg) return toolResult(msg);
      const result = await fn(client!, params);
      return toolResult(result);
    };
  }

  function guardedMcp(fn: (client: McpClient, params: any) => Promise<any>) {
    return async (_id: string, params: any) => {
      const msg = requireToken();
      if (msg) return toolResult(msg);
      if (!mcpClient) return toolResult("MCP client not configured.");
      const result = await fn(mcpClient, params);
      return toolResult(result);
    };
  }

  // --- Board Tools ---

  api.registerTool({
    name: "monday_list_boards",
    description: "List boards in your monday.com account. Optionally filter by workspace or board kind.",
    parameters: boards.ListBoardsParams,
    execute: guarded(boards.listBoards),
  });

  api.registerTool({
    name: "monday_get_board",
    description: "Get detailed information about a specific board including columns, groups, and settings.",
    parameters: boards.GetBoardParams,
    execute: guarded(boards.getBoard),
  });

  api.registerTool({
    name: "monday_create_board",
    description: "Create a new board in monday.com. Can create from scratch or from a template.",
    parameters: boards.CreateBoardParams,
    execute: guarded(boards.createBoard),
  });

  api.registerTool({
    name: "monday_delete_board",
    description: "Permanently delete a board. This action cannot be undone.",
    parameters: boards.DeleteBoardParams,
    execute: guarded(boards.deleteBoard),
  });

  // --- Item Tools ---

  api.registerTool({
    name: "monday_get_items",
    description: "Get items from a board with optional filtering by group, column value, or pagination cursor.",
    parameters: items.GetItemsParams,
    execute: guarded(items.getItems),
  });

  api.registerTool({
    name: "monday_create_item",
    description: "Create a new item (row) on a board. Optionally set column values and target group.",
    parameters: items.CreateItemParams,
    execute: guarded(items.createItem),
  });

  api.registerTool({
    name: "monday_update_item_columns",
    description: "Update column values for an existing item. Pass column_values as { column_id: value }.",
    parameters: items.UpdateItemColumnsParams,
    execute: guarded(items.updateItemColumns),
  });

  api.registerTool({
    name: "monday_move_item",
    description: "Move an item to a different group on the same board.",
    parameters: items.MoveItemParams,
    execute: guarded(items.moveItem),
  });

  api.registerTool({
    name: "monday_delete_item",
    description: "Permanently delete an item. This action cannot be undone.",
    parameters: items.DeleteItemParams,
    execute: guarded(items.deleteItem),
  });

  // --- Column Tools ---

  api.registerTool({
    name: "monday_create_column",
    description: "Add a new column to a board with a specified type and optional defaults.",
    parameters: columns.CreateColumnParams,
    execute: guarded(columns.createColumn),
  });

  api.registerTool({
    name: "monday_get_column_values",
    description: "Get all column values for a specific item, including settings for each column.",
    parameters: columns.GetColumnValuesParams,
    execute: guarded(columns.getColumnValues),
  });

  // --- Group Tools ---

  api.registerTool({
    name: "monday_list_groups",
    description: "List all groups on a board with their IDs, titles, colors, and positions.",
    parameters: groups.ListGroupsParams,
    execute: guarded(groups.listGroups),
  });

  api.registerTool({
    name: "monday_create_group",
    description: "Create a new group on a board. Optionally position it at the top.",
    parameters: groups.CreateGroupParams,
    execute: guarded(groups.createGroup),
  });

  api.registerTool({
    name: "monday_move_item_to_group",
    description: "Move an item to a different group on the same board.",
    parameters: groups.MoveItemToGroupParams,
    execute: guarded(groups.moveItemToGroup),
  });

  // --- Update Tools ---

  api.registerTool({
    name: "monday_create_update",
    description: "Post a comment/update on an item. Supports HTML formatting.",
    parameters: updates.CreateUpdateParams,
    execute: guarded(updates.createUpdate),
  });

  api.registerTool({
    name: "monday_get_updates",
    description: "Get updates (comments) on an item, including replies.",
    parameters: updates.GetUpdatesParams,
    execute: guarded(updates.getUpdates),
  });

  api.registerTool({
    name: "monday_reply_to_update",
    description: "Reply to an existing update/comment on an item.",
    parameters: updates.ReplyToUpdateParams,
    execute: guarded(updates.replyToUpdate),
  });

  // --- Document Tools ---

  api.registerTool({
    name: "monday_list_docs",
    description: "List documents in monday.com. Optionally filter by workspace.",
    parameters: docs.ListDocsParams,
    execute: guarded(docs.listDocs),
  });

  api.registerTool({
    name: "monday_create_doc",
    description: "Create a new document in a workspace with markdown content.",
    parameters: docs.CreateDocParams,
    execute: guarded(docs.createDoc),
  });

  api.registerTool({
    name: "monday_read_doc",
    description: "Read a document's content including all blocks.",
    parameters: docs.ReadDocParams,
    execute: guarded(docs.readDoc),
  });

  // --- Workspace Tools ---

  api.registerTool({
    name: "monday_list_workspaces",
    description: "List workspaces in your monday.com account.",
    parameters: workspaces.ListWorkspacesParams,
    execute: guarded(workspaces.listWorkspaces),
  });

  api.registerTool({
    name: "monday_create_workspace",
    description: "Create a new workspace. Can be open (visible to all) or closed (invite-only).",
    parameters: workspaces.CreateWorkspaceParams,
    execute: guarded(workspaces.createWorkspace),
  });

  // --- User Tools ---

  api.registerTool({
    name: "monday_list_users_and_teams",
    description: "List users and teams in your monday.com account. Filter by user kind.",
    parameters: users.ListUsersAndTeamsParams,
    execute: guarded(users.listUsersAndTeams),
  });

  // --- Search Tools ---

  api.registerTool({
    name: "monday_search",
    description: "Search for boards and items across monday.com. Optionally scope to specific boards.",
    parameters: searchModule.SearchParams,
    execute: guarded(searchModule.search),
  });

  // --- Advanced Tools ---

  api.registerTool({
    name: "monday_raw_graphql",
    description:
      "Execute a raw GraphQL query or mutation against the monday.com API. Use for operations not covered by other tools.",
    parameters: advanced.RawGraphqlParams,
    execute: guarded((c, p) => advanced.rawGraphql(c, mcpClient, p)),
  });

  api.registerTool({
    name: "monday_get_schema",
    description:
      "Inspect the monday.com GraphQL schema. Optionally specify a type name to get its fields and details.",
    parameters: advanced.GetSchemaParams,
    execute: guarded((c, p) => advanced.getSchema(c, mcpClient, p)),
  });

  // --- Subitem Tools ---

  api.registerTool({
    name: "monday_get_subitems",
    description: "Get all subitems for a parent item, including their column values.",
    parameters: subitems.GetSubitemsParams,
    execute: guarded(subitems.getSubitems),
  });

  api.registerTool({
    name: "monday_create_subitem",
    description: "Create a subitem under a parent item. Subitems have their own independent column schema.",
    parameters: subitems.CreateSubitemParams,
    execute: guarded(subitems.createSubitem),
  });

  api.registerTool({
    name: "monday_update_subitem_columns",
    description: "Update column values on a subitem. Requires the subitems board ID (not the parent board).",
    parameters: subitems.UpdateSubitemColumnsParams,
    execute: guarded(subitems.updateSubitemColumns),
  });

  // --- Automation / Webhook Tools ---

  api.registerTool({
    name: "monday_list_webhooks",
    description: "List all webhooks configured on a board.",
    parameters: automations.ListWebhooksParams,
    execute: guarded(automations.listWebhooks),
  });

  api.registerTool({
    name: "monday_create_webhook",
    description: "Create a webhook on a board to receive real-time event notifications via HTTP POST.",
    parameters: automations.CreateWebhookParams,
    execute: guarded(automations.createWebhook),
  });

  // --- Activity Log Tools ---

  api.registerTool({
    name: "monday_get_activity_log",
    description: "Get the activity log for a board. Shows changes, creations, and updates with optional filters.",
    parameters: activity.GetActivityLogParams,
    execute: guarded(activity.getActivityLog),
  });

  // --- File Tools ---

  api.registerTool({
    name: "monday_add_file_to_column",
    description: "Add a file to a file column on an item by providing a public URL.",
    parameters: files.AddFileToColumnParams,
    execute: guarded(files.addFileToColumn),
  });

  // --- Account Tools ---

  api.registerTool({
    name: "monday_get_account_info",
    description: "Get current user profile and account details including plan tier, teams, and admin status.",
    parameters: account.GetAccountInfoParams,
    execute: guarded(account.getAccountInfo),
  });
}

// Re-export for direct use
export { MondayClient } from "./monday-client.js";
export { McpClient } from "./mcp-client.js";
export * from "./utils/column-values.js";
export * from "./utils/pagination.js";
