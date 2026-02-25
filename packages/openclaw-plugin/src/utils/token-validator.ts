/**
 * API Token Validator Utility
 * Proactively helps users set up their monday.com API token
 */

import { MondayClient } from "../monday-client.js";

export class TokenValidator {
  /**
   * Check if API token is configured and valid
   */
  static async validateToken(client?: MondayClient): Promise<boolean> {
    const token = this.getConfiguredToken();

    if (!token) {
      await this.offerTokenSetup();
      return false;
    }

    if (client) {
      try {
        // Test the token with a simple query
        await client.query(`
          query TestConnection {
            me {
              id
              name
            }
          }
        `);
        return true;
      } catch (error) {
        await this.offerTokenTroubleshooting();
        return false;
      }
    }

    return true; // Token exists but not tested
  }

  /**
   * Get configured API token from various sources
   */
  private static getConfiguredToken(): string | null {
    // Check environment variable first (most secure)
    if (process.env.MONDAY_API_TOKEN) {
      return process.env.MONDAY_API_TOKEN;
    }

    // Check OpenClaw config (would integrate with actual config system)
    // This is a placeholder - real implementation would check actual config
    const openclawConfig = this.getOpenClawConfig();
    if (openclawConfig?.plugins?.['monday-com']?.apiToken) {
      return openclawConfig.plugins['monday-com'].apiToken;
    }

    return null;
  }

  /**
   * Offer proactive token setup help
   */
  private static async offerTokenSetup(): Promise<void> {
    console.log(`
🦙 OOPS! NO API TOKEN FOUND! 🔑

I need your monday.com API token to work my magic!
Don't worry - this is super easy to fix.

🎯 **What you need:**
• A monday.com account (free plan works great!)
• 2 minutes to get your API token
• One quick configuration step

✨ **What you'll get:**
• Visual board management instead of config files
• AI session logging to monday.com
• Smart project and workflow wizards
• WhatsApp contact sync (if you use it)

Ready to get set up?
`);

    const choice = await this.promptUser('How can I help?', [
      { label: '🚀 Guide me through token setup', value: 'guide' },
      { label: '📚 I need the detailed instructions', value: 'docs' },
      { label: '🔗 Just open monday.com for me', value: 'open' },
      { label: '⏸️ I\'ll do this later', value: 'later' }
    ]);

    switch (choice) {
      case 'guide':
        console.log('\n🔑 Run this command for step-by-step guidance:\n   /monday-setup-token\n');
        break;
      case 'docs':
        console.log('\n📚 Full documentation available at:\n   /monday-setup-token\n');
        break;
      case 'open':
        console.log('\n🔗 Opening monday.com...\n   Go to your avatar → Developers → My Access Tokens\n');
        break;
      case 'later':
        console.log('\n⏸️ No problem! Run /monday-setup-token when you\'re ready!\n');
        break;
    }
  }

  /**
   * Offer token troubleshooting help
   */
  private static async offerTokenTroubleshooting(): Promise<void> {
    console.log(`
🦙 TOKEN ISSUE DETECTED! 🔧

Your API token seems to have a problem. Let me help fix it!

🔍 **Common issues:**
• Token wasn't copied completely
• Extra spaces or quote marks
• Token has expired
• Wrong monday.com account

Don't worry - we can fix this quickly!
`);

    const choice = await this.promptUser('What should we try?', [
      { label: '🔄 Generate a fresh token', value: 'fresh' },
      { label: '🔧 Check my configuration', value: 'check' },
      { label: '📚 Show me the setup guide', value: 'guide' },
      { label: '🆘 I need human help', value: 'support' }
    ]);

    switch (choice) {
      case 'fresh':
        console.log('\n🔄 Let\'s get a fresh token:\n   /monday-setup-token\n');
        break;
      case 'check':
        this.showConfigurationCheck();
        break;
      case 'guide':
        console.log('\n📚 Complete setup guide:\n   /monday-setup-token\n');
        break;
      case 'support':
        this.showSupportInfo();
        break;
    }
  }

  /**
   * Show configuration check steps
   */
  private static showConfigurationCheck(): void {
    console.log(`
🔍 CONFIGURATION CHECK

Let's verify your token setup:

1️⃣ **Check Environment Variable:**
   echo $MONDAY_API_TOKEN

   Should show: eyJ... (your token)
   If empty: Token not set as environment variable

2️⃣ **Check OpenClaw Config:**
   openclaw config get plugins.monday-com.apiToken

   Should show: eyJ... (your token)
   If empty: Token not set in OpenClaw config

3️⃣ **Verify Token Format:**
   • Should be 200+ characters long
   • Should start with "eyJ" or similar
   • No extra spaces at beginning/end
   • No quote marks in the token itself

🔧 **If something looks wrong:**
   Run: /monday-setup-token for fresh setup
`);
  }

  /**
   * Show support information
   */
  private static showSupportInfo(): void {
    console.log(`
🆘 **GET HUMAN HELP**

📧 **Email Support**: support@openclaw.ai
💬 **Discord Community**: https://discord.gg/openclaw
📚 **Documentation**: https://docs.openclaw.ai
🐛 **Report Issues**: https://github.com/openclaw/openclaw/issues

🦙 **Don't worry!** Token setup issues are super common and easy to fix.
Most problems are solved in under 5 minutes with the right guidance.

📝 **When contacting support, include:**
• Your operating system (Windows/Mac/Linux)
• Which configuration method you tried
• Any error messages you saw
`);
  }

  /**
   * Quick token validation for commands
   */
  static async requireToken(client?: MondayClient): Promise<MondayClient | null> {
    const isValid = await this.validateToken(client);
    if (!isValid) {
      console.log('\n🦙 Please set up your API token first, then try again!\n');
      return null;
    }
    return client || new MondayClient({ apiToken: this.getConfiguredToken()! });
  }

  // Placeholder methods for integration
  private static getOpenClawConfig(): any {
    // This would integrate with actual OpenClaw config system
    return {};
  }

  private static async promptUser(message: string, options: any[]): Promise<string> {
    console.log('\n' + message);
    options.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.label}`);
    });

    // In real implementation, this would be interactive
    return options[0].value;
  }
}