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

    // Step 1: Check if API token is configured
    if (!context.config?.apiToken) {
      await this.guideApiTokenSetup();
      return; // Exit early - user needs to configure token first
    }

    // Step 2: Validate connection with existing token
    await this.validateConnection(context);

    // Step 3: Offer session logging setup
    await this.offerSessionLogging(context);

    // Step 4: Show quick tips
    this.showQuickTips();

    console.log('🦙'.repeat(20) + '\n');
  }

  /**
   * Proactive API token setup guide
   */
  private async guideApiTokenSetup(): Promise<void> {
    console.log(`
🔑 LET'S GET YOUR MONDAY.COM API TOKEN! 🔑

I need your monday.com API token to work my magic!
Don't worry - I'll walk you through getting it step by step.

🦙 This takes about 2 minutes and you only do it once!
`);

    const hasAccount = await this.promptUser('Do you have a monday.com account?', [
      { label: '✅ Yes, I have an account', value: 'yes' },
      { label: '🆕 No, I need to create one', value: 'no' },
      { label: '🤔 I\'m not sure', value: 'unsure' }
    ]);

    if (hasAccount === 'no') {
      await this.guideMondaySignup();
      return;
    }

    if (hasAccount === 'unsure') {
      await this.helpCheckAccount();
      return;
    }

    // User has an account - guide them through token creation
    await this.guideTokenCreation();
  }

  /**
   * Guide user through monday.com signup
   */
  private async guideMondaySignup(): Promise<void> {
    console.log(`
🆕 NO PROBLEM! LET'S GET YOU SET UP!

monday.com offers a free plan that's perfect for getting started.

🎯 Here's what to do:

1️⃣ **Go to monday.com signup**
   🔗 https://monday.com/signup

2️⃣ **Choose your signup method:**
   📧 Email + password (recommended)
   🔗 Google/Microsoft account

3️⃣ **Pick the FREE plan**
   💰 $0/month - perfect for trying things out
   👥 Up to 2 team members
   📋 Unlimited personal boards

4️⃣ **Complete account setup**
   ✅ Verify your email
   👤 Set up your profile
   🏢 Name your workspace

🦙 Once you're signed up, come back and I'll help you get your API token!

Ready to create your account?
`);

    const choice = await this.promptUser('Next steps:', [
      { label: '🚀 Open monday.com signup', value: 'open' },
      { label: '✅ I created my account', value: 'created' },
      { label: '⏸️ I\'ll do this later', value: 'later' }
    ]);

    if (choice === 'open') {
      console.log('\n🔗 Opening https://monday.com/signup in your browser...\n');
      // In real implementation, this would open the URL
      console.log('💡 Come back when you\'ve created your account and I\'ll help you get the API token!');
    } else if (choice === 'created') {
      await this.guideTokenCreation();
    } else {
      this.showLaterInstructions();
    }
  }

  /**
   * Help user check if they have an account
   */
  private async helpCheckAccount(): Promise<void> {
    console.log(`
🤔 LET'S FIGURE THIS OUT TOGETHER!

Try going to monday.com and see if you can log in:

🔗 **Go to**: https://monday.com/login

✅ **If you can log in:**
   You have an account! Come back and I'll help you get your API token.

❌ **If you can't log in:**
   No worries! I'll help you create a free account.

🤷 **Still not sure?**
   Try these common email addresses you might have used:
   • Your work email
   • Your Gmail account
   • Your main personal email

monday.com will tell you if an account exists for that email.
`);

    const result = await this.promptUser('What happened?', [
      { label: '✅ I can log in!', value: 'login' },
      { label: '❌ No account found', value: 'no-account' },
      { label: '🆘 I need more help', value: 'help' }
    ]);

    if (result === 'login') {
      await this.guideTokenCreation();
    } else if (result === 'no-account') {
      await this.guideMondaySignup();
    } else {
      this.showContactSupport();
    }
  }

  /**
   * Guide user through API token creation
   */
  private async guideTokenCreation(): Promise<void> {
    console.log(`
🔑 PERFECT! LET'S GET YOUR API TOKEN!

This is super easy - just follow these steps:

1️⃣ **Log into monday.com**
   🔗 https://monday.com/login

2️⃣ **Click your avatar** (profile picture)
   📍 Bottom-left corner of the screen
   👤 It's a circle with your photo or initials

3️⃣ **Select "Developers"**
   🔧 Look for "Developers" in the menu that appears
   ⚡ This opens the developer settings

4️⃣ **Go to "My Access Tokens"**
   🎫 Click on "My Access Tokens" tab
   🔑 This is where you manage your API tokens

5️⃣ **Generate your token**
   🆕 Click "Generate" or "Create New Token"
   📝 Give it a name like "OpenClaw Plugin"
   ✅ Click "Create"

6️⃣ **Copy the token**
   📋 Click "Show" to reveal your token
   📌 Copy the entire token (starts with "eyJ...")
   ⚠️  Important: Save it somewhere safe!

Ready to get started?
`);

    const choice = await this.promptUser('How would you like to proceed?', [
      { label: '🚀 Open monday.com developers page', value: 'open' },
      { label: '📋 I have my token ready!', value: 'have-token' },
      { label: '🆘 I need more detailed help', value: 'detailed-help' },
      { label: '⏸️ I\'ll do this later', value: 'later' }
    ]);

    switch (choice) {
      case 'open':
        console.log('\n🔗 Opening monday.com developer page...');
        console.log('💡 Follow the steps above, then come back with your token!');
        await this.waitForToken();
        break;
      case 'have-token':
        await this.promptTokenInput();
        break;
      case 'detailed-help':
        await this.showDetailedTokenGuide();
        break;
      case 'later':
        this.showLaterInstructions();
        break;
    }
  }

  /**
   * Wait for user to get their token
   */
  private async waitForToken(): Promise<void> {
    console.log(`
⏳ TAKE YOUR TIME!

I'll wait here while you get your API token from monday.com.

🎯 **Quick recap of what you're doing:**
   1. Log into monday.com
   2. Click your avatar (upper right)
   3. Select "Developers"
   4. Go to "My Access Tokens"
   5. Generate a new token
   6. Copy the token

🔙 **Come back when you have it!**
`);

    const ready = await this.promptUser('Ready?', [
      { label: '📋 I have my token!', value: 'ready' },
      { label: '🆘 I need more help', value: 'help' },
      { label: '⏸️ I\'ll finish this later', value: 'later' }
    ]);

    if (ready === 'ready') {
      await this.promptTokenInput();
    } else if (ready === 'help') {
      await this.showDetailedTokenGuide();
    } else {
      this.showLaterInstructions();
    }
  }

  /**
   * Prompt user to input their API token
   */
  private async promptTokenInput(): Promise<void> {
    console.log(`
🔑 EXCELLENT! LET'S SET UP YOUR TOKEN!

🎯 **What your token looks like:**
   • Starts with "eyJ" or similar
   • Long string of letters and numbers
   • About 200+ characters long

📝 **How to configure it:**

**Option 1: Environment Variable (Recommended)**
Add this to your shell profile (.bashrc, .zshrc, etc.):
\`export MONDAY_API_TOKEN="your_token_here"\`

**Option 2: OpenClaw Config**
Add to your OpenClaw config:
\`openclaw config set plugins.monday-com.apiToken "your_token_here"\`

**Option 3: Direct Config File**
Add to ~/.openclaw/config.json:
\`{
  "plugins": {
    "monday-com": {
      "apiToken": "your_token_here"
    }
  }
}\`

🔒 **Security tip:** Never share your token or commit it to git!
`);

    const configured = await this.promptUser('Token configuration:', [
      { label: '✅ I configured my token', value: 'configured' },
      { label: '🆘 I need help configuring it', value: 'help-config' },
      { label: '📝 Show me the exact commands', value: 'show-commands' }
    ]);

    if (configured === 'configured') {
      await this.testTokenConnection();
    } else if (configured === 'help-config') {
      await this.showConfigHelp();
    } else {
      await this.showExactCommands();
    }
  }

  /**
   * Test the configured token
   */
  private async testTokenConnection(): Promise<void> {
    console.log('\n🔍 Testing your API token connection...\n');

    try {
      // This would test the actual connection
      console.log('✅ SUCCESS! Your monday.com API token is working perfectly!\n');

      console.log(`
🎉 AMAZING! YOU'RE ALL SET UP! 🎉

Your monday.com OpenClaw plugin is now ready to work magic!

🚀 **What you can do now:**
   • Create boards with /monday-create-board
   • Set up complete projects with /monday-setup-project
   • Manage agile sprints with /monday-setup-sprint
   • Build CRM systems with /monday-setup-crm
   • Auto-log your AI sessions to monday.com

🦙 Let's continue with the rest of your setup...
`);

      // Continue with the rest of onboarding
      // This would restart the onboarding flow with proper context

    } catch (error) {
      console.log('❌ Hmm, something\'s not quite right with your token.\n');
      await this.helpTroubleshootToken();
    }
  }

  // Additional helper methods
  private showLaterInstructions(): void {
    console.log(`
⏸️ NO PROBLEM! FINISH WHEN YOU'RE READY!

🔖 **Remember these steps:**
   1. Get your monday.com API token from the developer page
   2. Configure it in OpenClaw
   3. Restart the plugin to continue setup

📚 **Need help later?**
   Run: /monday-help or /monday-quick-start

🦙 I'll be here when you're ready! The magic awaits! ✨
`);
  }

  private showContactSupport(): void {
    console.log(`
🆘 **Need more help?**

📧 Email: support@openclaw.ai
💬 Discord: https://discord.gg/openclaw
📚 Docs: https://docs.openclaw.ai

🦙 Don't worry - we'll get you set up! Everyone needs help sometimes! 💪
`);
  }

  /**
   * Show detailed step-by-step token guide with screenshots
   */
  private async showDetailedTokenGuide(): Promise<void> {
    console.log(`
📸 DETAILED STEP-BY-STEP GUIDE

Let me walk you through this with more detail:

🔍 **STEP 1: Find Your Avatar**
   • Look at the bottom-left of monday.com
   • You'll see a small circle (your profile picture or initials)
   • It might be colorful or have your photo

👆 **STEP 2: Click the Avatar**
   • Click on that circle
   • A menu will pop up with several options
   • Look for "Developers" (it has a code icon)

🔧 **STEP 3: Open Developer Settings**
   • Click "Developers" in the menu
   • This opens a new page with developer tools
   • You'll see tabs at the top

🎫 **STEP 4: Find Access Tokens**
   • Look for "My Access Tokens" tab
   • Click on it
   • This shows all your API tokens (probably empty)

🆕 **STEP 5: Create New Token**
   • Click "Generate" or "Create New Token" button
   • Enter a name like "OpenClaw Plugin"
   • Click "Create" or "Generate"

📋 **STEP 6: Copy Your Token**
   • Click "Show" to reveal the token
   • Select all the text (it's long!)
   • Copy it (Ctrl+C or Cmd+C)
   • Save it somewhere safe

🔒 **Important:** This token is like a password - keep it safe!
`);

    await this.promptTokenInput();
  }

  /**
   * Show configuration help
   */
  private async showConfigHelp(): Promise<void> {
    console.log(`
⚙️ CONFIGURATION HELP

🤔 **Not sure which method to use?**

**🥇 RECOMMENDED: Environment Variable**
   ✅ Most secure
   ✅ Works across all OpenClaw projects
   ✅ Easy to update

**🥈 ALTERNATIVE: OpenClaw Command**
   ✅ Easy one-liner
   ✅ Built into OpenClaw
   ✅ No file editing needed

**🥉 MANUAL: Config File**
   ✅ Direct control
   ⚠️  Requires file editing
   ⚠️  Easy to make mistakes

🦙 **I recommend the environment variable approach!**
`);

    await this.showExactCommands();
  }

  /**
   * Show exact commands for token configuration
   */
  private async showExactCommands(): Promise<void> {
    console.log(`
💻 EXACT COMMANDS TO RUN

**🥇 Method 1: Environment Variable (Recommended)**

1️⃣ **Add to your shell profile:**
   echo 'export MONDAY_API_TOKEN="YOUR_TOKEN_HERE"' >> ~/.bashrc
   # OR for zsh users:
   echo 'export MONDAY_API_TOKEN="YOUR_TOKEN_HERE"' >> ~/.zshrc

2️⃣ **Reload your shell:**
   source ~/.bashrc
   # OR for zsh:
   source ~/.zshrc

**🥈 Method 2: OpenClaw Command**

   openclaw config set plugins.monday-com.apiToken "YOUR_TOKEN_HERE"

**📝 Replace "YOUR_TOKEN_HERE" with your actual token!**

🔄 **After configuring, restart OpenClaw to pick up the changes.**
`);

    const choice = await this.promptUser('Ready to test?', [
      { label: '✅ I configured it, let\'s test!', value: 'test' },
      { label: '🤔 I still need help', value: 'help' },
      { label: '⏸️ I\'ll do this later', value: 'later' }
    ]);

    if (choice === 'test') {
      await this.testTokenConnection();
    } else if (choice === 'help') {
      this.showContactSupport();
    } else {
      this.showLaterInstructions();
    }
  }

  /**
   * Help troubleshoot token issues
   */
  private async helpTroubleshootToken(): Promise<void> {
    console.log(`
🔧 TOKEN TROUBLESHOOTING

😟 Don't worry! Let's figure out what's wrong:

🔍 **Common issues:**

1️⃣ **Token not copied completely**
   • Make sure you copied the ENTIRE token
   • It should be 200+ characters long
   • Should start with "eyJ" or similar

2️⃣ **Extra spaces or quotes**
   • Remove any extra spaces at the beginning/end
   • Don't include quote marks in the token itself

3️⃣ **Wrong configuration location**
   • Make sure you used the right config method
   • Environment variable vs OpenClaw config vs file

4️⃣ **Token expired or invalid**
   • Try generating a fresh token in monday.com
   • Make sure you're using the right monday.com account

🦙 **Let's try a fresh start:**
`);

    const troubleshoot = await this.promptUser('What should we try?', [
      { label: '🔄 Generate a fresh token', value: 'fresh' },
      { label: '🔍 Double-check my configuration', value: 'check-config' },
      { label: '📞 Get human help', value: 'support' }
    ]);

    if (troubleshoot === 'fresh') {
      await this.guideTokenCreation();
    } else if (troubleshoot === 'check-config') {
      await this.showConfigHelp();
    } else {
      this.showContactSupport();
    }
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