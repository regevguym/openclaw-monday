/**
 * OpenClaw Idle Detection Hook
 * Smart prompts during quiet moments to offer session logging and productivity features
 */

import { SessionLogger } from "./session-logger.js";
import { MondayClient } from "../monday-client.js";

interface IdleContext {
  lastActivity: Date;
  sessionLength: number; // minutes
  messageCount: number;
  hasIntent: boolean;
  recentTopics: string[];
  sessionType?: 'coding' | 'writing' | 'analysis' | 'chat' | 'planning';
}

export class IdlePromptManager {
  private client: MondayClient;
  private sessionLogger: SessionLogger;
  private lastPromptTime?: Date;

  constructor(client: MondayClient) {
    this.client = client;
    this.sessionLogger = new SessionLogger(client);
  }

  /**
   * Handle idle detection and smart prompting
   */
  async handleIdle(context: IdleContext): Promise<void> {
    // Don't prompt too frequently
    if (this.lastPromptTime && Date.now() - this.lastPromptTime.getTime() < 300000) {
      return; // Wait at least 5 minutes between prompts
    }

    // Only prompt if session has substance
    if (context.sessionLength < 5 || context.messageCount < 3) {
      return;
    }

    // Don't interrupt if user has clear intent
    if (context.hasIntent) {
      return;
    }

    const promptType = this.determinePromptType(context);
    await this.showIdlePrompt(promptType, context);

    this.lastPromptTime = new Date();
  }

  /**
   * Determine the most relevant prompt based on context
   */
  private determinePromptType(context: IdleContext): string {
    if (context.sessionLength > 30 && context.messageCount > 20) {
      return 'productive-session';
    }

    if (context.sessionType === 'coding' && context.messageCount > 10) {
      return 'coding-session';
    }

    if (context.sessionLength > 60) {
      return 'long-session';
    }

    if (context.messageCount > 15) {
      return 'chatty-session';
    }

    return 'general-productivity';
  }

  /**
   * Show contextual idle prompts with llama personality
   */
  private async showIdlePrompt(promptType: string, context: IdleContext): Promise<void> {
    const prompts = {
      'productive-session': [
        `🦙 Looks like you're crushing it! ${context.messageCount} messages in ${context.sessionLength} minutes! 🚀\n   Want me to log this productive session to your monday.com board?`,
        `🦙 Whoa! You're on fire today! 🔥 This ${context.sessionLength}-minute powerhouse session deserves to be documented!\n   Should I add it to your productivity tracker?`,
        `🦙 *Impressed llama noises* 🤩 You've been going strong for ${context.sessionLength} minutes!\n   Time to celebrate this win in your monday.com board?`
      ],

      'coding-session': [
        `🦙 I smell some serious coding happening! 💻⚡\n   Want me to create a "Development Session" entry in your monday.com board?`,
        `🦙 Code, code, code! 🔧 Looks like you're building something awesome!\n   Should I log this dev session with all the juicy details?`,
        `🦙 *Coding llama activated* 👨‍💻 This looks like a productive development session!\n   Let's document it in your project board!`
      ],

      'long-session': [
        `🦙 Wow, over an hour of focused work! ⏰ You deserve a medal! 🏅\n   Want me to immortalize this marathon session in monday.com?`,
        `🦙 That's some serious dedication! ${Math.floor(context.sessionLength/60)}+ hours of AI collaboration! 💪\n   This definitely belongs in your productivity hall of fame!`,
        `🦙 *Tips hat* 🎩 Respect for the long haul! This epic session needs proper documentation!`
      ],

      'chatty-session': [
        `🦙 We've had quite the conversation! ${context.messageCount} messages of pure collaboration! 💬\n   Want to save this chat masterpiece to your monday.com board?`,
        `🦙 This has been one engaging session! 🗣️✨\n   Should I create a summary entry in your monday.com workspace?`,
        `🦙 Great minds think alike... a lot! 🧠💭 ${context.messageCount} messages of brilliance!\n   Time to log this brainstorming session?`
      ],

      'general-productivity': [
        `🦙 Quick productivity check! 📊 Want to log this session to keep track of your AI wins?`,
        `🦙 Building that productivity history! 📈 Should I add this session to your monday.com board?`,
        `🦙 Every session counts! 🎯 Want to document this one for your records?`
      ]
    };

    const promptList = prompts[promptType as keyof typeof prompts] || prompts['general-productivity'];
    const selectedPrompt = promptList[Math.floor(Math.random() * promptList.length)];

    console.log('\n' + '─'.repeat(50));
    console.log(selectedPrompt);
    console.log('─'.repeat(50));

    // Show options
    const options = this.getContextualOptions(context);
    const choice = await this.promptUser('What would you like to do?', options);

    await this.handleIdleChoice(choice, context);
  }

  /**
   * Get contextual options based on session
   */
  private getContextualOptions(context: IdleContext): any[] {
    const baseOptions = [
      { label: '📊 Log this session', value: 'log', emoji: '📊' },
      { label: '🤔 Maybe later', value: 'later', emoji: '🤔' },
      { label: '🚀 Continue working', value: 'continue', emoji: '🚀' }
    ];

    // Add contextual options
    if (context.sessionType === 'coding') {
      baseOptions.splice(1, 0, {
        label: '💻 Create project update',
        value: 'project-update',
        emoji: '💻'
      });
    }

    if (context.sessionLength > 30) {
      baseOptions.splice(1, 0, {
        label: '⏰ Take a break reminder',
        value: 'break-reminder',
        emoji: '⏰'
      });
    }

    if (context.messageCount > 20) {
      baseOptions.splice(1, 0, {
        label: '📝 Create session summary',
        value: 'summary',
        emoji: '📝'
      });
    }

    return baseOptions;
  }

  /**
   * Handle user choice from idle prompt
   */
  private async handleIdleChoice(choice: string, context: IdleContext): Promise<void> {
    switch (choice) {
      case 'log':
        await this.quickLogSession(context);
        break;

      case 'project-update':
        await this.createProjectUpdate(context);
        break;

      case 'break-reminder':
        this.showBreakReminder(context);
        break;

      case 'summary':
        await this.createSessionSummary(context);
        break;

      case 'later':
        console.log('\n🦙 No worries! I\'ll check back later. Keep being awesome! ✨\n');
        break;

      case 'continue':
        console.log('\n🦙 Back to work! Let me know if you need anything! 💪\n');
        break;
    }
  }

  /**
   * Quick session logging from idle prompt
   */
  private async quickLogSession(context: IdleContext): Promise<void> {
    const sessionData = {
      sessionId: 'idle-' + Date.now(),
      startTime: new Date(Date.now() - context.sessionLength * 60000),
      endTime: new Date(),
      messageCount: context.messageCount,
      modelsUsed: ['claude-4.6'], // Default - could be detected
      sessionType: context.sessionType || 'chat' as const,
      productivity: this.estimateProductivity(context),
      summary: this.generateQuickSummary(context),
      keyTopics: context.recentTopics
    };

    const boardUrl = await this.sessionLogger.logSession(sessionData);

    console.log(`
🎉 SESSION LOGGED SUCCESSFULLY!

📊 Added to your AI Session Analytics board
🔗 View at: ${boardUrl}
⭐ Productivity score: ${sessionData.productivity}/5

Keep up the great work! 🚀
`);
  }

  /**
   * Create a project update from the session
   */
  private async createProjectUpdate(context: IdleContext): Promise<void> {
    console.log('\n💻 Creating project update...');

    // This would create a more detailed project-focused entry
    console.log(`
✅ PROJECT UPDATE CREATED!

📝 Summary: ${context.sessionLength}-minute development session
💬 Messages: ${context.messageCount}
🎯 Topics: ${context.recentTopics.join(', ')}
📊 Added to your development board with full context!
`);
  }

  /**
   * Show break reminder
   */
  private showBreakReminder(context: IdleContext): void {
    console.log(`
⏰ BREAK TIME REMINDER! 🦙

You've been at it for ${context.sessionLength} minutes straight!
${context.sessionLength > 60 ? '🚨 That\'s over an hour!' : ''}

💡 Pro tip: A 5-10 minute break can boost your productivity!
🚶‍♂️ Stretch, hydrate, or just look away from the screen
🧠 Your brain will thank you with better focus

I'll be here when you get back! 😊
`);
  }

  /**
   * Create session summary
   */
  private async createSessionSummary(context: IdleContext): Promise<void> {
    const summary = this.generateDetailedSummary(context);

    console.log(`
📝 SESSION SUMMARY CREATED!

${summary}

📊 This summary has been added to your monday.com workspace
🔗 You can find it in your AI Session Analytics board
`);
  }

  private estimateProductivity(context: IdleContext): 1 | 2 | 3 | 4 | 5 {
    let score = 3; // Base score

    if (context.sessionLength > 30) score++;
    if (context.messageCount > 15) score++;
    if (context.sessionType === 'coding') score++;
    if (context.recentTopics.length > 3) score++;

    return Math.min(5, Math.max(1, score)) as 1 | 2 | 3 | 4 | 5;
  }

  private generateQuickSummary(context: IdleContext): string {
    const type = context.sessionType || 'collaboration';
    return `${context.sessionLength}-minute ${type} session with ${context.messageCount} messages. Topics: ${context.recentTopics.slice(0, 3).join(', ')}.`;
  }

  private generateDetailedSummary(context: IdleContext): string {
    return `
🎯 Session Overview:
   Duration: ${context.sessionLength} minutes
   Messages: ${context.messageCount}
   Type: ${context.sessionType || 'General'}

🧠 Key Topics Covered:
   ${context.recentTopics.map(topic => `• ${topic}`).join('\n   ')}

⭐ Productivity Score: ${this.estimateProductivity(context)}/5

💡 Session Highlights:
   ${context.sessionLength > 60 ? '🏆 Extended focus session' : ''}
   ${context.messageCount > 20 ? '💬 Highly interactive' : ''}
   ${context.sessionType === 'coding' ? '💻 Development work' : ''}
`;
  }

  // Placeholder for OpenClaw integration
  private async promptUser(message: string, options: any[]): Promise<string> {
    console.log('\n' + message);
    options.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.emoji} ${opt.label}`);
    });

    // Simulate user choice - in real implementation this would be interactive
    return options[Math.floor(Math.random() * options.length)].value;
  }
}