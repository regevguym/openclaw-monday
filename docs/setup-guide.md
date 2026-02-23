# monday.com Agent Platform - Setup Guide

## Prerequisites

- A monday.com account with API access
- API token from: monday.com → Avatar menu → Developers → My Access Tokens
- Node.js 18+

## 1. OpenClaw Plugin Installation

### From npm (when published)

```bash
openclaw plugin install @mondaydotcomorg/openclaw-monday
```

Configure your API token:
```bash
openclaw config set plugins.monday-com.apiToken "YOUR_TOKEN_HERE"
```

### From source

```bash
git clone https://github.com/mondaycom/openclaw-monday.git
cd openclaw-monday
npm install
npm run build

# Install the plugin locally
openclaw plugin install ./packages/openclaw-plugin
```

### Configuration

The plugin accepts these config options:

| Option | Required | Description |
|---|---|---|
| `apiToken` | Yes | Your monday.com API token |
| `workspaceId` | No | Default workspace ID to scope operations |
| `mcpServerUrl` | No | MCP server URL override |
| `enableMcp` | No | Enable MCP passthrough (default: true) |

You can also set the token via environment variable: `MONDAY_API_TOKEN`

### Available Tools (26)

| Category | Tools |
|---|---|
| Boards | `monday_list_boards`, `monday_get_board`, `monday_create_board`, `monday_delete_board` |
| Items | `monday_get_items`, `monday_create_item`, `monday_update_item_columns`, `monday_move_item`, `monday_delete_item` |
| Columns | `monday_create_column`, `monday_get_column_values` |
| Groups | `monday_list_groups`, `monday_create_group`, `monday_move_item_to_group` |
| Updates | `monday_create_update`, `monday_get_updates`, `monday_reply_to_update` |
| Docs | `monday_list_docs`, `monday_create_doc`, `monday_read_doc` |
| Workspaces | `monday_list_workspaces`, `monday_create_workspace` |
| Users | `monday_list_users_and_teams` |
| Search | `monday_search` |
| Advanced | `monday_raw_graphql`, `monday_get_schema` |

---

## 2. Claude Code Plugin Installation

### Option A: Install as plugin

Copy the `packages/claude-code-plugin` directory to your Claude Code plugins location:

```bash
cp -r packages/claude-code-plugin ~/.claude/plugins/monday-com
```

### Option B: Use standalone skill file

Copy the skill file to your Claude Code skills directory:

```bash
mkdir -p ~/.claude/skills/monday-com
cp skill-files/claude-code/SKILL.md ~/.claude/skills/monday-com/SKILL.md
```

### Configure MCP Server

Add to your project's `.mcp.json` or global Claude Code config:

```json
{
  "mcpServers": {
    "monday": {
      "type": "streamable-http",
      "url": "https://mcp.monday.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Or set the environment variable `MONDAY_API_TOKEN` and use:
```json
{
  "mcpServers": {
    "monday": {
      "type": "streamable-http",
      "url": "https://mcp.monday.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MONDAY_API_TOKEN}"
      }
    }
  }
}
```

### Slash Commands

Once installed, you can use:
- `/monday-help` - Quick reference for available operations
- `/monday-create-board` - Guided board creation wizard

---

## 3. Cursor Rules Installation

Copy the Cursor rules file to your project:

```bash
mkdir -p .cursor/rules
cp skill-files/cursor/monday.mdc .cursor/rules/monday.mdc
```

This will activate automatically when working with monday.com-related files.

---

## 4. Generic LLM Context

For any other AI agent/LLM, paste the contents of `skill-files/generic/monday-agent-guide.md` into your system prompt or context window.

---

## Testing

### Run unit tests
```bash
cd packages/openclaw-plugin
npm test
```

### Run live smoke test
```bash
cd packages/openclaw-plugin
MONDAY_API_TOKEN=your-token npx tsx tests/smoke-test.ts
```

The smoke test creates a temporary private board, adds items, and cleans up after itself.

---

## Getting Your API Token

1. Log in to monday.com
2. Click your avatar (bottom-left)
3. Select **Developers**
4. Go to **My Access Tokens**
5. Click **Show** or generate a new token
6. Copy the token

**Token permissions:** The token inherits your account permissions. For full functionality, use an admin token. For read-only operations, a viewer token works for query tools.
