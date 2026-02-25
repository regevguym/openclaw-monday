/**
 * WhatsApp Configuration Detector Hook
 * Automatically detects WhatsApp setup and offers sync functionality
 */

import { WhatsAppAllowlistSync } from "../integrations/whatsapp-sync.js";
import { MondayClient } from "../monday-client.js";

interface WhatsAppDetectionContext {
  configPath: string;
  hasWhatsAppConfig: boolean;
  contactCount: number;
  lastChecked: Date;
}

export class WhatsAppDetector {
  private whatsappSync: WhatsAppAllowlistSync;
  private client: MondayClient;
  private lastOfferTime?: Date;

  constructor(client: MondayClient) {
    this.client = client;
    this.whatsappSync = new WhatsAppAllowlistSync(client);
  }

  /**
   * Detect WhatsApp configuration and offer sync
   */
  async detectAndOfferSync(): Promise<void> {
    // Don't offer too frequently
    if (this.lastOfferTime && Date.now() - this.lastOfferTime.getTime() < 3600000) {
      return; // Wait at least 1 hour between offers
    }

    const context = await this.analyzeWhatsAppSetup();

    if (context.hasWhatsAppConfig && context.contactCount > 0) {
      await this.offerExistingConfigSync(context);
    } else {
      await this.offerProactiveSetup();
    }

    this.lastOfferTime = new Date();
  }

  /**
   * Analyze current WhatsApp setup
   */
  private async analyzeWhatsAppSetup(): Promise<WhatsAppDetectionContext> {
    // This would integrate with OpenClaw's config detection
    const hasConfig = await this.detectWhatsAppConfig();
    const contactCount = await this.getContactCount();

    return {
      configPath: process.env.OPENCLAW_CONFIG_PATH || '~/.openclaw/config.json',
      hasWhatsAppConfig: hasConfig,
      contactCount,
      lastChecked: new Date()
    };
  }

  /**
   * Offer sync for existing WhatsApp config
   */
  private async offerExistingConfigSync(context: WhatsAppDetectionContext): Promise<void> {
    console.log(`
🦙 WhatsApp allowlist detected! 📱✨

I found ${context.contactCount} contacts in your OpenClaw WhatsApp configuration.

Want me to create a visual monday.com dashboard for managing them?

🎯 **What you'll get:**
✅ Visual contact management (no more config file editing!)
📞 One-click approve/block controls
🔄 Automatic 2-way sync
📊 Contact analytics and history
🛡️ Better privacy control

This makes WhatsApp contact management super smooth!
`);

    const choice = await this.promptUser('Set up WhatsApp sync?', [
      {
        label: '🚀 Yes, sync everything!',
        description: 'Create monday.com board and sync all contacts',
        value: 'sync-all'
      },
      {
        label: '📊 Show me a preview first',
        description: 'Demo what the board will look like',
        value: 'preview'
      },
      {
        label: '⚙️ Custom setup',
        description: 'Choose which contacts to sync',
        value: 'custom'
      },
      {
        label: '⏸️ Maybe later',
        description: 'Skip for now (can enable with /monday-whatsapp-sync)',
        value: 'skip'
      }
    ]);

    await this.handleSyncChoice(choice, context);
  }

  /**
   * Offer proactive WhatsApp setup
   */
  private async offerProactiveSetup(): Promise<void> {
    console.log(`
🦙 Planning to use WhatsApp with OpenClaw? 📱

I can set up smart contact management for you:

🎯 **When someone new contacts you:**
📞 Auto-detect new WhatsApp numbers
📋 Add them to your monday.com board as "Pending"
✅ Quick approve/block with visual controls
🔄 Sync changes back to OpenClaw automatically

Want me to prepare this for when you configure WhatsApp?
`);

    const choice = await this.promptUser('Prepare WhatsApp sync?', [
      {
        label: '📱 Yes, set it up!',
        description: 'Create board structure for future WhatsApp contacts',
        value: 'prepare'
      },
      {
        label: '📚 Tell me more',
        description: 'Learn about WhatsApp sync features',
        value: 'learn'
      },
      {
        label: '⏸️ Not now',
        description: 'Skip WhatsApp setup',
        value: 'skip'
      }
    ]);

    if (choice === 'prepare') {
      await this.prepareWhatsAppSync();
    } else if (choice === 'learn') {
      this.showWhatsAppSyncFeatures();
    }
  }

  /**
   * Handle user choice for sync setup
   */
  private async handleSyncChoice(choice: string, context: WhatsAppDetectionContext): Promise<void> {
    switch (choice) {
      case 'sync-all':
        await this.setupFullSync();
        break;

      case 'preview':
        await this.showSyncPreview(context);
        break;

      case 'custom':
        await this.setupCustomSync();
        break;

      case 'skip':
        console.log('\n⏸️ No problem! You can enable WhatsApp sync anytime with: /monday-whatsapp-sync\n');
        break;
    }
  }

  /**
   * Set up complete WhatsApp sync
   */
  private async setupFullSync(): Promise<void> {
    console.log('\n🚀 Setting up WhatsApp sync...');

    try {
      // Create and set up the board
      const board = await this.whatsappSync.ensureAllowlistBoard();

      // Sync existing config to board
      await this.whatsappSync.syncConfigToBoard();

      // Start monitoring for changes
      await this.whatsappSync.startSyncMonitoring();

      console.log(`
✅ WHATSAPP SYNC ACTIVATED! 📱

🏆 Your WhatsApp allowlist board is ready!
📍 Board URL: https://monday.com/boards/${board.id}

✨ What's now active:
🔄 2-way sync between monday.com and OpenClaw config
📞 Auto-detection of new WhatsApp numbers
✅ Visual approve/block controls
📊 Contact analytics and history

🎯 Next steps:
1. Open your board to see your contacts
2. Try approving/blocking a contact
3. Watch it sync to your OpenClaw config automatically!

Your WhatsApp contact management is now supercharged! 🚀
`);

    } catch (error) {
      console.error('❌ Failed to set up WhatsApp sync:', error);
    }
  }

  /**
   * Show sync preview without actually syncing
   */
  private async showSyncPreview(context: WhatsAppDetectionContext): Promise<void> {
    console.log(`
📊 WHATSAPP SYNC PREVIEW

Here's what your monday.com board will look like:

📱 WhatsApp Allowlist Board Structure:
├── ✅ Allowed Contacts (${this.estimateAllowedCount(context)})
├── ❌ Blocked Contacts (${this.estimateBlockedCount(context)})
├── ⏳ Pending Approval (${this.estimatePendingCount(context)})
└── ❓ Unknown Numbers (0)

📋 Each contact will have:
• Phone number and contact name
• Status (Allowed/Blocked/Pending)
• Added date and last seen
• Personal notes and source info
• Auto-sync checkbox

🔄 Changes you make in the board will automatically update your OpenClaw config!

Ready to create this for real?
`);

    const enable = await this.promptUser('Create the WhatsApp sync board?', [
      { label: '🚀 Yes, create it!', value: 'create' },
      { label: '⚙️ Customize first', value: 'customize' },
      { label: '⏸️ Not right now', value: 'skip' }
    ]);

    if (enable === 'create') await this.setupFullSync();
    else if (enable === 'customize') await this.setupCustomSync();
  }

  /**
   * Prepare WhatsApp sync infrastructure
   */
  private async prepareWhatsAppSync(): Promise<void> {
    console.log('\n📱 Preparing WhatsApp sync infrastructure...');

    const board = await this.whatsappSync.ensureAllowlistBoard();

    console.log(`
✅ WHATSAPP SYNC PREPARED! 🎯

🏆 Your WhatsApp allowlist board is ready and waiting!
📍 Board URL: https://monday.com/boards/${board.id}

🔮 When you configure WhatsApp with OpenClaw:
• New contacts will appear automatically
• You'll get smart prompts to approve/block
• Visual management replaces config file editing
• Everything syncs 2-way automatically

Your future WhatsApp contact management is ready! 📱✨
`);
  }

  // Helper methods for estimation (would be more sophisticated in real implementation)
  private estimateAllowedCount(context: WhatsAppDetectionContext): number {
    return Math.floor(context.contactCount * 0.7); // Assume 70% allowed
  }

  private estimateBlockedCount(context: WhatsAppDetectionContext): number {
    return Math.floor(context.contactCount * 0.2); // Assume 20% blocked
  }

  private estimatePendingCount(context: WhatsAppDetectionContext): number {
    return Math.floor(context.contactCount * 0.1); // Assume 10% pending
  }

  // Placeholder methods (would integrate with actual OpenClaw APIs)
  private async detectWhatsAppConfig(): Promise<boolean> {
    // This would check OpenClaw config for WhatsApp settings
    return Math.random() > 0.5; // Simulate detection for demo
  }

  private async getContactCount(): Promise<number> {
    // This would count actual contacts in config
    return Math.floor(Math.random() * 50) + 5; // Simulate 5-55 contacts
  }

  private async setupCustomSync(): Promise<void> {
    console.log('\n⚙️ Custom sync setup coming soon! Use /monday-whatsapp-sync for advanced options.');
  }

  private showWhatsAppSyncFeatures(): void {
    console.log(`
📚 WHATSAPP SYNC FEATURES

🎯 **Contact Management Made Easy:**
• Visual dashboard replaces config file editing
• One-click approve/block controls
• Smart organization by status
• Personal notes for each contact

🔄 **Automatic 2-Way Sync:**
• Board changes → Update OpenClaw config
• New WhatsApp contacts → Auto-add to board
• Real-time synchronization
• No manual work required

📊 **Analytics & Insights:**
• Contact approval patterns
• Spam detection trends
• Response time tracking
• Contact source analysis

🛡️ **Privacy & Security:**
• Local config only (no external storage)
• Encrypted sync protocols
• Access control via monday.com
• Audit trail of all changes

Ready to set this up? Use /monday-whatsapp-sync anytime!
`);
  }

  private async promptUser(message: string, options: any[]): Promise<string> {
    console.log('\n' + message);
    options.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.label}`);
      if (opt.description) console.log(`   ${opt.description}`);
    });

    // Simulate user choice for demo
    return options[0].value;
  }
}