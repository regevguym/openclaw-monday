/**
 * MCP passthrough client for advanced monday.com operations.
 *
 * Connects to the monday.com MCP server (mcp.monday.com/mcp) for
 * operations that benefit from the official MCP tools, such as
 * dynamic schema inspection and raw GraphQL execution.
 */

export interface McpClientConfig {
  /** MCP server URL (default: https://mcp.monday.com/mcp) */
  serverUrl?: string;
  /** monday.com API token for authentication */
  apiToken: string;
}

export interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export class McpClient {
  private serverUrl: string;
  private apiToken: string;

  constructor(config: McpClientConfig) {
    this.serverUrl = config.serverUrl ?? "https://mcp.monday.com/mcp";
    this.apiToken = config.apiToken;
  }

  /**
   * Call an MCP tool on the monday.com MCP server.
   *
   * Uses the Streamable HTTP transport (POST to server URL)
   * following the MCP specification.
   */
  async callTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<any> {
    const requestBody = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `MCP server error: HTTP ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as any;

    if (result.error) {
      throw new Error(
        `MCP tool error: ${result.error.message ?? JSON.stringify(result.error)}`
      );
    }

    return result.result;
  }

  /**
   * List available tools from the MCP server.
   */
  async listTools(): Promise<
    Array<{ name: string; description?: string; inputSchema?: any }>
  > {
    const requestBody = {
      jsonrpc: "2.0",
      id: this.generateId(),
      method: "tools/list",
      params: {},
    };

    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `MCP server error: HTTP ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as any;

    if (result.error) {
      throw new Error(
        `MCP list tools error: ${result.error.message ?? JSON.stringify(result.error)}`
      );
    }

    return result.result?.tools ?? [];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
