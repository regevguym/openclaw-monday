/**
 * WhatsApp Allowlist Sync Integration
 * 2-way sync between OpenClaw WhatsApp config and monday.com boards
 */

import { MondayClient } from "../monday-client.js";
import * as fs from 'fs/promises';
import * as path from 'path';

interface WhatsAppContact {
  phoneNumber: string;
  name?: string;
  status: 'allowed' | 'blocked' | 'pending' | 'unknown';
  addedDate: Date;
  lastSeen?: Date;
  notes?: string;
  source: 'config' | 'incoming' | 'manual';
}

interface OpenClawConfig {
  whatsapp?: {
    allowedNumbers: string[];
    blockedNumbers: string[];
    pendingNumbers: string[];
    autoApprove: boolean;
  };
}

export class WhatsAppAllowlistSync {
  private client: MondayClient;
  private allowlistBoard?: { id: number; name: string };
  private configPath: string;
  private syncInterval?: NodeJS.Timeout;

  constructor(client: MondayClient) {
    this.client = client;
    this.configPath = this.getOpenClawConfigPath();
  }

  /**
   * Get generic OpenClaw config path (works across installations)
   */
  private getOpenClawConfigPath(): string {
    // Check common OpenClaw config locations
    const possiblePaths = [
      process.env.OPENCLAW_CONFIG_PATH,
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.openclaw', 'config.json'),
      path.join(process.cwd(), 'openclaw.config.json'),
      path.join(process.cwd(), '.openclaw', 'config.json'),
    ].filter(Boolean);

    return possiblePaths[0] || path.join(process.env.HOME || '', '.openclaw', 'config.json');
  }

  /**
   * Smart offer for WhatsApp allowlist sync
   */
  async offerWhatsAppSync(): Promise<boolean> {
    const hasWhatsAppConfig = await this.detectWhatsAppConfig();

    if (!hasWhatsAppConfig) {
      console.log(`
🦙 No WhatsApp config detected yet, but I can set up sync for when you add it! 📱

I can create a monday.com board to manage your WhatsApp allowlist:
✅ Visual contact management
📞 Easy approve/block controls
📊 Track contact history
🔄 2-way sync with OpenClaw config

Want to set it up now?
`);
      return await this.promptUser('Set up WhatsApp allowlist sync?', [
        { label: '📱 Yes, create the board!', value: true },
        { label: '⏸️  Maybe later', value: false }
      ]);
    }

    const contactCount = await this.getContactCount();

    console.log(`
🦙 WhatsApp allowlist detected! 📱✨

I found ${contactCount.allowed} allowed numbers and ${contactCount.blocked} blocked numbers in your OpenClaw config.

Want me to sync them to a monday.com board? You'll get:
🎯 Visual contact management dashboard
📞 One-click approve/block controls
📊 Contact history and notes
🔄 Automatic 2-way sync
📈 Analytics on contact patterns

This makes WhatsApp contact management super smooth!
`);

    return await this.promptUser('Sync WhatsApp allowlist to monday.com?', [
      { label: '🚀 Yes, sync everything!', value: true },
      { label: '📊 Show me a preview first', value: 'preview' },
      { label: '⏸️  Not right now', value: false }
    ]);
  }

  /**
   * Detect if WhatsApp config exists
   */
  private async detectWhatsAppConfig(): Promise<boolean> {
    try {
      const config = await this.loadOpenClawConfig();
      return !!(config.whatsapp?.allowedNumbers || config.whatsapp?.blockedNumbers);
    } catch {
      return false;
    }
  }

  /**
   * Get contact count from config
   */
  private async getContactCount(): Promise<{ allowed: number; blocked: number; pending: number }> {
    try {
      const config = await this.loadOpenClawConfig();
      return {
        allowed: config.whatsapp?.allowedNumbers?.length || 0,
        blocked: config.whatsapp?.blockedNumbers?.length || 0,
        pending: config.whatsapp?.pendingNumbers?.length || 0
      };
    } catch {
      return { allowed: 0, blocked: 0, pending: 0 };
    }
  }

  /**
   * Load OpenClaw config file
   */
  private async loadOpenClawConfig(): Promise<OpenClawConfig> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      // Create default config if it doesn't exist
      const defaultConfig: OpenClawConfig = {
        whatsapp: {
          allowedNumbers: [],
          blockedNumbers: [],
          pendingNumbers: [],
          autoApprove: false
        }
      };

      await this.saveOpenClawConfig(defaultConfig);
      return defaultConfig;
    }
  }

  /**
   * Save OpenClaw config file
   */
  private async saveOpenClawConfig(config: OpenClawConfig): Promise<void> {
    try {
      // Ensure directory exists
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('✅ OpenClaw config updated successfully');
    } catch (error) {
      console.error('❌ Failed to save OpenClaw config:', error);
      throw error;
    }
  }

  /**
   * Create or get WhatsApp allowlist board
   */
  async ensureAllowlistBoard(): Promise<{ id: number; name: string }> {
    if (this.allowlistBoard) return this.allowlistBoard;

    const boardName = "📱 WhatsApp Allowlist";

    try {
      // Check if board exists
      const boards = await this.client.query(`
        query GetBoards {
          boards(limit: 50) {
            id
            name
          }
        }
      `);

      const existingBoard = boards.data.boards.find((b: any) =>
        b.name === boardName || b.name.includes("WhatsApp")
      );

      if (existingBoard) {
        this.allowlistBoard = { id: existingBoard.id, name: existingBoard.name };
        return this.allowlistBoard;
      }

      // Create new allowlist board
      const newBoard = await this.client.mutation(`
        mutation CreateAllowlistBoard($boardName: String!) {
          create_board(
            board_name: $boardName
            board_kind: private
            description: "WhatsApp contact allowlist with 2-way sync to OpenClaw configuration"
          ) {
            id
            name
          }
        }
      `, { boardName });

      const boardId = newBoard.data.create_board.id;
      await this.setupAllowlistBoardStructure(boardId);

      this.allowlistBoard = { id: boardId, name: boardName };
      return this.allowlistBoard;

    } catch (error) {
      console.error('Failed to create allowlist board:', error);
      throw error;
    }
  }

  /**
   * Set up WhatsApp allowlist board structure
   */
  private async setupAllowlistBoardStructure(boardId: number): Promise<void> {
    // Create columns for contact management
    const columns = [
      { title: "Phone Number", type: "phone" },
      { title: "Contact Name", type: "text" },
      { title: "Status", type: "status", settings: JSON.stringify({
        labels: [
          { name: "Allowed", color: "green" },
          { name: "Blocked", color: "red" },
          { name: "Pending", color: "orange" },
          { name: "Unknown", color: "gray" }
        ]
      })},
      { title: "Added Date", type: "date" },
      { title: "Last Seen", type: "date" },
      { title: "Source", type: "dropdown", settings: JSON.stringify({
        labels: ["Config", "Incoming", "Manual"]
      })},
      { title: "Notes", type: "long-text" },
      { title: "Auto Sync", type: "checkbox" }
    ];

    for (const column of columns) {
      await this.client.mutation(`
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

    // Create groups for organization
    const groups = [
      { title: "✅ Allowed Contacts", color: "green" },
      { title: "❌ Blocked Contacts", color: "red" },
      { title: "⏳ Pending Approval", color: "orange" },
      { title: "❓ Unknown Numbers", color: "gray" }
    ];

    for (const group of groups) {
      await this.client.mutation(`
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
   * Sync contacts from OpenClaw config to monday.com board
   */
  async syncConfigToBoard(): Promise<void> {
    console.log('🔄 Syncing OpenClaw config to monday.com board...');

    const config = await this.loadOpenClawConfig();
    const board = await this.ensureAllowlistBoard();

    if (!config.whatsapp) return;

    // Sync allowed numbers
    for (const phoneNumber of config.whatsapp.allowedNumbers || []) {
      await this.addContactToBoard({
        phoneNumber,
        status: 'allowed',
        addedDate: new Date(),
        source: 'config'
      }, board.id);
    }

    // Sync blocked numbers
    for (const phoneNumber of config.whatsapp.blockedNumbers || []) {
      await this.addContactToBoard({
        phoneNumber,
        status: 'blocked',
        addedDate: new Date(),
        source: 'config'
      }, board.id);
    }

    // Sync pending numbers
    for (const phoneNumber of config.whatsapp.pendingNumbers || []) {
      await this.addContactToBoard({
        phoneNumber,
        status: 'pending',
        addedDate: new Date(),
        source: 'config'
      }, board.id);
    }

    console.log(`✅ Synced ${this.getTotalContactCount(config)} contacts to monday.com board`);
  }

  /**
   * Add contact to monday.com board
   */
  private async addContactToBoard(contact: WhatsAppContact, boardId: number): Promise<void> {
    const columnValues = {
      phone_number: contact.phoneNumber,
      contact_name: contact.name || "",
      status: { label: this.capitalizeFirst(contact.status) },
      added_date: contact.addedDate.toISOString().split('T')[0],
      last_seen: contact.lastSeen?.toISOString().split('T')[0] || "",
      source: { label: this.capitalizeFirst(contact.source) },
      notes: contact.notes || "",
      auto_sync: true
    };

    await this.client.mutation(`
      mutation AddContact($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
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
      boardId: boardId.toString(),
      itemName: contact.name || contact.phoneNumber,
      columnValues: JSON.stringify(columnValues)
    });
  }

  /**
   * Start 2-way sync monitoring
   */
  async startSyncMonitoring(): Promise<void> {
    console.log('🔄 Starting 2-way sync monitoring...');

    // Poll for changes every 30 seconds
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncBoardToConfig();
      } catch (error) {
        console.error('Sync error:', error);
      }
    }, 30000);

    console.log('✅ 2-way sync monitoring active');
  }

  /**
   * Stop sync monitoring
   */
  stopSyncMonitoring(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log('⏸️ Sync monitoring stopped');
    }
  }

  /**
   * Sync changes from monday.com board back to OpenClaw config
   */
  async syncBoardToConfig(): Promise<void> {
    if (!this.allowlistBoard) return;

    try {
      // Get all items from the board
      const boardData = await this.client.query(`
        query GetAllowlistItems($boardId: ID!) {
          boards(ids: [$boardId]) {
            items_page {
              items {
                id
                name
                column_values {
                  id
                  title
                  text
                  value
                }
              }
            }
          }
        }
      `, { boardId: this.allowlistBoard.id.toString() });

      const items = boardData.data.boards[0].items_page.items;
      const contacts = this.parseContactsFromBoard(items);

      // Update OpenClaw config
      await this.updateConfigFromContacts(contacts);

    } catch (error) {
      console.error('Failed to sync board to config:', error);
    }
  }

  /**
   * Parse contacts from monday.com board items
   */
  private parseContactsFromBoard(items: any[]): WhatsAppContact[] {
    return items.map(item => {
      const columns = item.column_values;
      const getColumnValue = (title: string) => columns.find((c: any) => c.title === title)?.text || '';

      const phoneNumber = getColumnValue('Phone Number');
      const statusText = getColumnValue('Status').toLowerCase();
      const status = this.parseStatus(statusText);

      return {
        phoneNumber,
        name: getColumnValue('Contact Name') || undefined,
        status,
        addedDate: new Date(getColumnValue('Added Date') || Date.now()),
        lastSeen: getColumnValue('Last Seen') ? new Date(getColumnValue('Last Seen')) : undefined,
        notes: getColumnValue('Notes') || undefined,
        source: getColumnValue('Source').toLowerCase() as 'config' | 'incoming' | 'manual'
      };
    }).filter(contact => contact.phoneNumber); // Filter out empty phone numbers
  }

  /**
   * Parse status from board text
   */
  private parseStatus(statusText: string): 'allowed' | 'blocked' | 'pending' | 'unknown' {
    const status = statusText.toLowerCase();
    if (status.includes('allow')) return 'allowed';
    if (status.includes('block')) return 'blocked';
    if (status.includes('pending')) return 'pending';
    return 'unknown';
  }

  /**
   * Update OpenClaw config from parsed contacts
   */
  private async updateConfigFromContacts(contacts: WhatsAppContact[]): Promise<void> {
    const config = await this.loadOpenClawConfig();

    // Ensure whatsapp config exists
    if (!config.whatsapp) {
      config.whatsapp = {
        allowedNumbers: [],
        blockedNumbers: [],
        pendingNumbers: [],
        autoApprove: false
      };
    }

    // Rebuild lists from board data
    config.whatsapp.allowedNumbers = contacts
      .filter(c => c.status === 'allowed')
      .map(c => c.phoneNumber);

    config.whatsapp.blockedNumbers = contacts
      .filter(c => c.status === 'blocked')
      .map(c => c.phoneNumber);

    config.whatsapp.pendingNumbers = contacts
      .filter(c => c.status === 'pending')
      .map(c => c.phoneNumber);

    await this.saveOpenClawConfig(config);
    console.log(`🔄 Updated OpenClaw config: ${config.whatsapp.allowedNumbers.length} allowed, ${config.whatsapp.blockedNumbers.length} blocked, ${config.whatsapp.pendingNumbers.length} pending`);
  }

  /**
   * Add new incoming number to both board and config
   */
  async addIncomingNumber(phoneNumber: string, name?: string): Promise<void> {
    console.log(`📞 New WhatsApp number detected: ${phoneNumber}`);

    const contact: WhatsAppContact = {
      phoneNumber,
      name,
      status: 'pending',
      addedDate: new Date(),
      source: 'incoming',
      notes: 'Auto-detected incoming number'
    };

    // Add to monday.com board
    const board = await this.ensureAllowlistBoard();
    await this.addContactToBoard(contact, board.id);

    // Update OpenClaw config
    const config = await this.loadOpenClawConfig();
    if (!config.whatsapp) {
      config.whatsapp = { allowedNumbers: [], blockedNumbers: [], pendingNumbers: [], autoApprove: false };
    }

    if (!config.whatsapp.pendingNumbers.includes(phoneNumber)) {
      config.whatsapp.pendingNumbers.push(phoneNumber);
      await this.saveOpenClawConfig(config);
    }

    console.log(`✅ Added ${phoneNumber} to pending approval list`);
    this.showNewNumberPrompt(contact);
  }

  /**
   * Show prompt for new incoming number
   */
  private showNewNumberPrompt(contact: WhatsAppContact): void {
    console.log(`
🦙 New WhatsApp number wants to chat! 📱

📞 Number: ${contact.phoneNumber}
${contact.name ? `👤 Name: ${contact.name}` : ''}
📅 Detected: ${contact.addedDate.toLocaleString()}

I've added it to your monday.com allowlist board as "Pending".
You can:
✅ Approve it in the board (Status → Allowed)
❌ Block it in the board (Status → Blocked)
📋 View all contacts: https://monday.com/boards/${this.allowlistBoard?.id}

The change will sync automatically to your OpenClaw config! 🔄
`);
  }

  // Helper methods
  private getTotalContactCount(config: OpenClawConfig): number {
    const whatsapp = config.whatsapp;
    if (!whatsapp) return 0;

    return (whatsapp.allowedNumbers?.length || 0) +
           (whatsapp.blockedNumbers?.length || 0) +
           (whatsapp.pendingNumbers?.length || 0);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Placeholder methods
  private async promptUser(message: string, options: any[]): Promise<any> {
    console.log('\n' + message);
    options.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.label}`);
    });
    return options[0].value; // Simulate user choice
  }
}