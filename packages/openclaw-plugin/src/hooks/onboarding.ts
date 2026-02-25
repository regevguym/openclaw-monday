/**
 * OpenClaw Plugin Onboarding Hook
 * First-time setup and feature introduction
 */

import { MondayClient } from "../monday-client.js";
import { SessionLogger } from "./session-logger.js";

interface OnboardingContext {
  user: {
    id: string;
    name?: string;
    isNewUser: boolean;
  };
  config: {
    apiToken: string;
    workspaceId?: number;
  };
}

export class OnboardingFlow {
  private client: MondayClient;
  private sessionLogger: SessionLogger;

  constructor(client: MondayClient) {
    this.client = client;
    this.sessionLogger = new SessionLogger(client);
  }

  /**
   * Main onboarding flow triggered on plugin installation
   */
  async runOnboarding(context: OnboardingContext): Promise<void> {
    console.log('\n' + '🦙'.repeat(20));
    this.showWelcomeLlama();

    // Step 1: Welcome and validate connection
    await this.validateConnection(context);

    // Step 2: Offer session logging setup
    await this.offerSessionLogging(context);

    // Step 3: Show quick tips
    this.showQuickTips();

    console.log('🦙'.repeat(20) + '\n');
  }

  /**
   * Show welcome llama with personality
   */
  private showWelcomeLlama(): void {
    console.log(`
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

    🎉 Welcome to monday.com OpenClaw! 🎉
    `);
  }

  /**
   * Validate API connection and show account info
   */
  private async validateConnection(context: OnboardingContext): Promise<void> {
    try {
      console.log('🔍 Testing your monday.com connection...\n');

      const accountInfo = await this.client.query(`
        query GetAccount {
          me {
            name
            email
            account {
              name
              plan {
                version
              }
            }
          }
          boards(limit: 1) {
            id
            name
          }
        }
      `);

      const user = accountInfo.data.me;
      const account = user.account;

      console.log(`✅ Connected successfully!
👋 Hey ${user.name}!
🏢 Account: ${account.name} (${account.plan.version})
📋 Access confirmed to your monday.com workspace!
`);

    } catch (error) {
      console.error('❌ Connection failed:', error);
      console.log('\n🔧 Please check your API token in the plugin settings.');
      return;
    }
  }

  /**
   * Smart offer for session logging with multiple options
   */
  private async offerSessionLogging(context: OnboardingContext): Promise<void> {
    const userName = context.user.name ? `, ${context.user.name}` : '';

    console.log(`
🚀 PRODUCTIVITY SUPERPOWER UNLOCKED! 🚀

Hey${userName}! Want to turn your AI sessions into pure gold?

I can automatically log every OpenClaw session to your monday.com boards:
📊 Track productivity metrics
⏱️  Monitor time and message counts
💰 Watch your AI investment ROI
🧠 See which models work best
🎯 Build a portfolio of your AI wins

Think of it as your AI success story, documented in real-time!

What sounds good?
`);

    const choice = await this.promptUser('Choose your adventure:', [
      {
        label: '🤖 Auto-log everything (Recommended)',
        description: 'Every session gets logged automatically - set it and forget it!',
        value: 'auto',
        emoji: '🤖'
      },
      {
        label: '🎯 Ask me each time',
        description: 'I\'ll offer to log productive sessions with smart suggestions',
        value: 'prompt',
        emoji: '🎯'
      },
      {
        label: '📊 Show me an example first',
        description: 'Create a demo session log so you can see the magic',
        value: 'demo',
        emoji: '📊'
      },
      {
        label: '⏸️  Maybe later',
        description: 'Skip for now (you can enable this anytime with /monday-settings)',
        value: 'skip',
        emoji: '⏸️'
      }
    ]);

    switch (choice) {
      case 'auto':
        await this.setupAutoLogging();
        break;
      case 'prompt':
        await this.setupPromptLogging();
        break;
      case 'demo':
        await this.createDemoSession();
        break;
      case 'skip':
        console.log('\n⏸️  No worries! You can enable session logging anytime with the command: /monday-session-logging\n');
        break;
    }
  }

  /**
   * Set up automatic session logging
   */
  private async setupAutoLogging(): Promise<void> {
    console.log('\n🤖 Setting up auto-logging...');

    // Create the analytics board
    const board = await this.sessionLogger.ensureAnalyticsBoard();

    console.log(`
✅ AUTO-LOGGING ACTIVATED! ⚡

🏆 Your "AI Session Analytics" board is ready!
📍 Board URL: https://monday.com/boards/${board.id}

From now on, every OpenClaw session will be automatically logged with:
📊 Session summaries and productivity scores
⏱️  Duration and message counts
💰 Cost tracking (when available)
🧠 Models used and session types
🔗 Direct links back to your sessions

Sit back and watch your AI productivity data grow! 📈
`);

    // Save preference
    await this.saveUserPreference('sessionLogging', 'auto');
  }

  /**
   * Set up prompt-based session logging
   */
  private async setupPromptLogging(): Promise<void> {
    console.log('\n🎯 Smart prompting enabled!');

    // Create the analytics board
    const board = await this.sessionLogger.ensureAnalyticsBoard();

    console.log(`
✅ SMART SESSION LOGGING ACTIVATED! 🧠

🏆 Your "AI Session Analytics" board is ready!
📍 Board URL: https://monday.com/boards/${board.id}

I'll intelligently detect productive sessions and offer to log them with personalized messages like:

🦙 "Holy llama! You just modified 12 files! Let's immortalize this coding spree!"
🦙 "That was an epic 73-message session! Future you will thank you!"
🦙 "Productivity level: 5/5! Let's celebrate this win!"

Get ready for some fun session logging prompts! 🎉
`);

    await this.saveUserPreference('sessionLogging', 'prompt');
  }

  /**
   * Create a demo session to show the user
   */
  private async createDemoSession(): Promise<void> {
    console.log('\n📊 Creating demo session...');

    const demoSession = {
      sessionId: 'demo-' + Date.now(),
      startTime: new Date(Date.now() - 2700000), // 45 minutes ago
      endTime: new Date(),
      messageCount: 23,
      modelsUsed: ['claude-4.6', 'gpt-4'],
      sessionType: 'coding' as const,
      costEstimate: 2.34,
      filesModified: ['src/app.ts', 'package.json', 'README.md'],
      keyTopics: ['TypeScript', 'API integration', 'Error handling'],
      productivity: 4 as const,
      summary: 'Built a robust API integration with comprehensive error handling and TypeScript types'
    };

    const boardUrl = await this.sessionLogger.logSession(demoSession);

    console.log(`
🎯 DEMO SESSION CREATED!

✨ Check out your example session log:
📍 ${boardUrl}

This shows exactly how your real sessions will be tracked:
📊 Rich metadata and productivity insights
⏱️  Duration: 45 minutes, 23 messages
💰 Estimated cost: $2.34
🧠 Models: Claude-4.6, GPT-4
📝 Smart summary of what you accomplished

Pretty cool, right? Want to enable this for real?
`);

    // Offer to enable after demo
    const enable = await this.promptUser('Enable session logging?', [
      { label: '🤖 Yes, auto-log everything!', value: 'auto' },
      { label: '🎯 Yes, but ask me each time', value: 'prompt' },
      { label: '⏸️  Not right now', value: 'skip' }
    ]);

    if (enable === 'auto') await this.setupAutoLogging();
    else if (enable === 'prompt') await this.setupPromptLogging();
  }

  /**
   * Show helpful tips for getting started
   */
  private showQuickTips(): void {
    console.log(`
🎯 QUICK START TIPS:

🚀 Try these commands to get started:
   /monday-quick-start    - Choose the perfect workflow setup
   /monday-create-board   - Create boards with smart templates
   /monday-setup-project  - Complete project environment setup

📚 Pro Tips:
   • Just say "create a sprint board" or "set up our CRM"
   • I'll guide you through everything step-by-step
   • All your sessions can be tracked in monday.com automatically

🦙 Ready to revolutionize your workflow? Let's build something amazing!
`);
  }

  // Placeholder methods for OpenClaw integration
  private async promptUser(message: string, options: any[]): Promise<string> {
    // This would integrate with OpenClaw's user interaction system
    console.log('\n' + message);
    options.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.emoji} ${opt.label}`);
      if (opt.description) console.log(`   ${opt.description}`);
    });

    // For demo purposes, return first option
    return options[0].value;
  }

  private async saveUserPreference(key: string, value: string): Promise<void> {
    // This would save to OpenClaw's user preferences system
    console.log(`💾 Saved preference: ${key} = ${value}`);
  }
}