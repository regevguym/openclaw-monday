---
name: monday-com-openclaw
description: OpenClaw-optimized monday.com integration with automated session logging and workflow intelligence
version: 3.0.0
globs: ["**/*monday*", "**/*board*", "**/*openclaw*"]
alwaysApply: false
---

# monday.com for OpenClaw

**OpenClaw-native monday.com integration** with automated session logging and intelligent project mapping.

**Requires:** Standard monday.com tools accessible via MCP server or API integration.

```
       ▄▄
      ▄██▄
      █OO█
      █< █
      ████
      ████
      ██████████████████ ▌
      ██████████████████
      ██████████████████
      ▀██████████████▀██
      ▀███          ███▀
       ▀██          ██▀
         |          |

       🦙 monday.com Agent! 🦙
```

## OpenClaw-Specific Features

**🎯 Session Intelligence:**
- Auto-track AI sessions in monday.com boards
- Log significant decisions and outcomes
- Create session summaries with links to created resources

**🤖 Agent Coordination:**
- Create boards for multi-agent workflows
- Track agent assignments and progress
- Log inter-agent communication and handoffs

**📊 Workflow Analytics:**
- Track session duration and complexity
- Monitor resource creation patterns
- Generate productivity insights

## OpenClaw Integration Patterns

### Session Logging Workflow
When starting a session:
1. `monday_get_account_info` → Cache user and account details
2. `monday_create_board("AI Session - [Date]")` → Create session tracking board
3. `monday_create_item` for each major task or decision point
4. Use item updates to log progress and outcomes

### Multi-Agent Coordination
For complex projects involving multiple agents:
1. `monday_create_board("Multi-Agent Project")` with agent-specific groups
2. `monday_create_item` for each agent's assigned tasks
3. Use item comments for inter-agent communication
4. Track handoffs and decision points in item updates

### Session Intelligence
Throughout the session:
- Log significant decisions with `monday_create_update`
- Track created resources in designated board items
- Use column values to indicate session status and progress
- Generate session summaries in board documentation

## Session Logging Pattern

**Automatic logging of:**
- Board/item/doc creation with context
- Significant problem-solving steps
- Resource discoveries and insights
- Error resolution and workarounds
- Session handoffs between agents or to humans

**Example session board:**
```
> **AI Session - Project Alpha Setup**
> - Created project structure (15 files)
> - Set up CI/CD pipeline
> - Generated documentation
> - Status: Ready for human review
> → [View session](https://acme.monday.com/boards/123456)
```

## Agent Workflow Integration

**Multi-agent coordination:**
- Create shared boards for agent collaboration
- Track task assignments between agents
- Log decision points and rationale
- Enable seamless human-agent handoffs

**Intelligent context sharing:**
- Cache project understanding in monday.com
- Share insights between session resumptions
- Enable "pickup where we left off" workflows

## Memory & Context

**Enhanced session memory:**
```yaml
session_data:
  board_id: "active_session_board"
  project_context: "detected_project_type"
  agent_assignments: [{"agent": "name", "task": "description"}]
  key_decisions: [{"decision": "what", "rationale": "why"}]
  created_resources: [{"type": "board", "id": "123", "link": "url"}]
```

**Context preservation:**
- Project state and progress
- Agent capabilities and specializations
- Human preferences and requirements
- Resource relationships and dependencies

---

*Designed for OpenClaw's intelligent agent orchestration. Enables seamless AI-to-AI and AI-to-human workflow handoffs.*