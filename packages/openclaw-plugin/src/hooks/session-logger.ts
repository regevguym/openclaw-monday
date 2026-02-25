/**
 * OpenClaw Session Logger Hook
 * Automatically offers to log AI sessions to monday.com boards
 */

import { MondayClient } from "../monday-client.js";

interface SessionMetadata {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  messageCount: number;
  modelsUsed: string[];
  sessionType: 'coding' | 'writing' | 'analysis' | 'chat' | 'planning' | 'debugging';
  costEstimate?: number;
  filesModified?: string[];
  keyTopics: string[];
  productivity: 1 | 2 | 3 | 4 | 5;
  summary: string;
}

export class SessionLogger {
  private client: MondayClient;
  private analyticsBoard?: { id: number; name: string };

  constructor(client: MondayClient) {
    this.client = client;
  }

  /**
   * Smart call-to-action messages with personality
   */
  private getCallToActionMessage(sessionData: SessionMetadata): string {
    const messages = [
      {
        condition: () => sessionData.messageCount > 50,
        message: `🦙 Wow! That was an epic ${sessionData.messageCount}-message session! Want me to log this productive marathon to your monday.com board? Your future self will thank you! 🚀`
      },
      {
        condition: () => sessionData.sessionType === 'coding' && sessionData.filesModified && sessionData.filesModified.length > 5,
        message: `🦙 Holy llama! You just modified ${sessionData.filesModified?.length} files! Let's immortalize this coding spree in your monday.com board - future you will be amazed! 💻✨`
      },
      {
        condition: () => sessionData.productivity >= 4,
        message: `🦙 That session was pure gold! ⭐ Productivity level: ${sessionData.productivity}/5! Want me to add this winner to your monday.com success board? Let's celebrate the wins! 🎉`
      },
      {
        condition: () => sessionData.sessionType === 'debugging',
        message: `🦙 Bug hunting mission complete! 🐛➡️💀 Let me log this debugging victory to your monday.com board - every solved bug deserves recognition! 🏆`
      },
      {
        condition: () => sessionData.costEstimate && sessionData.costEstimate > 1,
        message: `🦙 This $${sessionData.costEstimate} session better be worth logging! 💰 Want me to add it to your monday.com board so you can track your AI investment ROI? Smart spending! 📊`
      },
      {
        condition: () => sessionData.endTime.getTime() - sessionData.startTime.getTime() > 3600000, // 1 hour
        message: `🦙 Time flies when you're having fun! ⏰ ${this.formatDuration(sessionData)} well spent! Let's log this marathon to your monday.com board for posterity! 📝`
      }
    ];

    // Find first matching condition or use default
    const matchedMessage = messages.find(m => m.condition());
    return matchedMessage?.message || `🦙 Another great session in the books! Want me to log it to your monday.com board? Building that productivity history! 📈✨`;
  }

  /**
   * Offer session logging with smart call-to-action
   */
  async offerSessionLogging(sessionData: SessionMetadata): Promise<boolean> {
    const callToAction = this.getCallToActionMessage(sessionData);

    console.log('\n' + '='.repeat(60));
    console.log(callToAction);
    console.log('='.repeat(60));

    // In OpenClaw, this would be a proper user prompt
    // For now, we'll simulate the offer
    return await this.promptUser(callToAction, [
      { label: "Yes, log it! 🚀", value: true },
      { label: "Maybe next time 🤔", value: false },
      { label: "Set up auto-logging ⚡", value: 'auto' }
    ]);
  }

  /**
   * Create or get the AI Session Analytics board
   */
  async ensureAnalyticsBoard(): Promise<{ id: number; name: string }> {
    if (this.analyticsBoard) return this.analyticsBoard;

    const boardName = "🤖 AI Session Analytics";

    try {
      // Check if board already exists
      const boards = await this.client.query(`
        query GetBoards {
          boards(limit: 50) {
            id
            name
          }
        }
      `);

      const existingBoard = boards.data.boards.find((b: any) =>
        b.name === boardName || b.name.includes("AI Session")
      );

      if (existingBoard) {
        this.analyticsBoard = { id: existingBoard.id, name: existingBoard.name };
        return this.analyticsBoard;
      }

      // Create new analytics board
      const newBoard = await this.client.query(`
        mutation CreateAnalyticsBoard($boardName: String!) {
          create_board(
            board_name: $boardName
            board_kind: private
            description: "Automated logging of AI session analytics and productivity metrics"
          ) {
            id
            name
          }
        }
      `, { boardName });

      const boardId = newBoard.data.create_board.id;

      // Set up the board structure
      await this.setupBoardStructure(boardId);

      this.analyticsBoard = { id: boardId, name: boardName };
      return this.analyticsBoard;

    } catch (error) {
      console.error('Failed to create analytics board:', error);
      throw error;
    }
  }

  /**
   * Set up the board with proper columns and groups
   */
  private async setupBoardStructure(boardId: number): Promise<void> {
    // Create columns
    const columns = [
      { title: "Duration", type: "timeline" },
      { title: "Messages", type: "numbers" },
      { title: "Cost", type: "numbers", settings: JSON.stringify({ currency: "USD" }) },
      { title: "Models Used", type: "tags" },
      { title: "Session Type", type: "status" },
      { title: "Productivity", type: "rating" },
      { title: "Key Outcomes", type: "long-text" },
      { title: "Session Link", type: "link" }
    ];

    for (const column of columns) {
      await this.client.query(`
        mutation CreateColumn($boardId: ID!, $title: String!, $type: ColumnType!, $settings: JSON) {
          create_column(
            board_id: $boardId
            title: $title
            column_type: $type
            defaults: $settings
          ) {
            id
            title
          }
        }
      `, {
        boardId: boardId.toString(),
        title: column.title,
        type: column.type,
        settings: column.settings || "{}"
      });
    }

    // Create groups
    const groups = [
      { title: "🚀 This Week", color: "green" },
      { title: "📊 Last Week", color: "blue" },
      { title: "🏆 Top Sessions", color: "gold" },
      { title: "📝 Quick Chats", color: "gray" }
    ];

    for (const group of groups) {
      await this.client.query(`
        mutation CreateGroup($boardId: ID!, $title: String!) {
          create_group(
            board_id: $boardId
            group_name: $title
          ) {
            id
            title
          }
        }
      `, {
        boardId: boardId.toString(),
        title: group.title
      });
    }
  }

  /**
   * Log session to monday.com board
   */
  async logSession(sessionData: SessionMetadata): Promise<string> {
    const board = await this.ensureAnalyticsBoard();

    const itemName = sessionData.summary || `AI Session - ${sessionData.sessionType}`;
    const duration = this.formatDuration(sessionData);

    const columnValues = {
      duration: {
        from: sessionData.startTime.toISOString().split('T')[0],
        to: sessionData.endTime.toISOString().split('T')[0]
      },
      messages: sessionData.messageCount,
      cost: sessionData.costEstimate || 0,
      models_used: { tag_ids: sessionData.modelsUsed },
      session_type: { label: this.capitalizeFirst(sessionData.sessionType) },
      productivity: sessionData.productivity,
      key_outcomes: sessionData.summary,
      session_link: {
        url: `openclaw://session/${sessionData.sessionId}`,
        text: "Open Session"
      }
    };

    const result = await this.client.query(`
      mutation LogSession($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item(
          board_id: $boardId
          item_name: $itemName
          column_values: $columnValues
        ) {
          id
          name
        }
      }
    `, {
      boardId: board.id.toString(),
      itemName,
      columnValues: JSON.stringify(columnValues)
    });

    const boardUrl = `https://monday.com/boards/${board.id}`;
    return boardUrl;
  }

  private formatDuration(sessionData: SessionMetadata): string {
    const duration = sessionData.endTime.getTime() - sessionData.startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Placeholder for OpenClaw user prompt system
  private async promptUser(message: string, options: any[]): Promise<any> {
    // This would integrate with OpenClaw's user interaction system
    console.log(message);
    console.log('Options:', options.map(o => o.label).join(', '));
    return true; // Simulate user accepting for now
  }
}