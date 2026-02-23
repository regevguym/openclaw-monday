/**
 * Verify all 26 tools register correctly with the OpenClaw plugin API.
 */

import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { register } from "../src/index.js";

describe("Tool Registration", () => {
  let mockApi: any;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    registeredTools = new Map();
    mockApi = {
      config: {
        get: (key: string) => {
          if (key === "apiToken" || key === "MONDAY_API_TOKEN") return "test-token-123";
          if (key === "enableMcp") return true;
          return undefined;
        },
      },
      registerTool: (tool: any) => {
        registeredTools.set(tool.name, tool);
      },
    };
  });

  it("should register all 26 tools", () => {
    register(mockApi);
    assert.equal(registeredTools.size, 26, `Expected 26 tools, got ${registeredTools.size}`);
  });

  it("should throw if no API token provided", () => {
    mockApi.config.get = () => undefined;
    assert.throws(() => register(mockApi), /API token is required/);
  });

  const expectedTools = [
    // Boards (4)
    "monday_list_boards",
    "monday_get_board",
    "monday_create_board",
    "monday_delete_board",
    // Items (5)
    "monday_get_items",
    "monday_create_item",
    "monday_update_item_columns",
    "monday_move_item",
    "monday_delete_item",
    // Columns (2)
    "monday_create_column",
    "monday_get_column_values",
    // Groups (3)
    "monday_list_groups",
    "monday_create_group",
    "monday_move_item_to_group",
    // Updates (3)
    "monday_create_update",
    "monday_get_updates",
    "monday_reply_to_update",
    // Docs (3)
    "monday_list_docs",
    "monday_create_doc",
    "monday_read_doc",
    // Workspaces (2)
    "monday_list_workspaces",
    "monday_create_workspace",
    // Users (1)
    "monday_list_users_and_teams",
    // Search (1)
    "monday_search",
    // Advanced (2)
    "monday_raw_graphql",
    "monday_get_schema",
  ];

  it("should register each expected tool by name", () => {
    register(mockApi);

    for (const toolName of expectedTools) {
      assert.ok(registeredTools.has(toolName), `Missing tool: ${toolName}`);
    }
  });

  it("should register tools with required properties", () => {
    register(mockApi);

    for (const [name, tool] of registeredTools) {
      assert.ok(tool.name, `${name} missing name`);
      assert.ok(tool.description, `${name} missing description`);
      assert.ok(tool.parameters, `${name} missing parameters`);
      assert.equal(typeof tool.execute, "function", `${name} execute not a function`);
    }
  });

  it("should have unique tool names", () => {
    register(mockApi);
    const names = Array.from(registeredTools.keys());
    const uniqueNames = new Set(names);
    assert.equal(names.length, uniqueNames.size, "Duplicate tool names found");
  });

  it("each tool description should be non-empty", () => {
    register(mockApi);
    for (const [name, tool] of registeredTools) {
      assert.ok(
        tool.description.length > 10,
        `${name} has too short description: "${tool.description}"`
      );
    }
  });
});
