---
name: monday-session-settings
description: Configure AI session logging preferences and analytics board settings
category: settings
icon: ⚙️
---

# monday.com Session Logging Settings

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

       🦙 Session Settings! 🦙
```

Manage your AI session analytics and productivity tracking preferences.

## 🎯 Current Settings

**Session Logging**: `{current_session_logging_setting}`
**Analytics Board**: `{analytics_board_status}`
**Auto-Prompts**: `{idle_prompts_enabled}`
**Productivity Tracking**: `{productivity_tracking_enabled}`

## ⚙️ Configuration Options

### **1. Session Logging Mode**

Choose how you want your OpenClaw sessions to be tracked:

#### 🤖 **Auto-Log Everything** (Recommended)
- Every session automatically logged to your monday.com board
- Zero friction - just work and let the magic happen
- Perfect for building comprehensive productivity history
- **Best for**: Power users who want complete session tracking

#### 🎯 **Smart Prompts**
- AI detects productive sessions and offers to log them
- Personalized call-to-action messages based on session content
- You decide which sessions are worth logging
- **Best for**: Users who want control over what gets logged

#### 📊 **Manual Only**
- No automatic prompting or logging
- Use `/monday-log-session` command when you want to save something
- Complete control over your session data
- **Best for**: Privacy-conscious users or light usage

#### ⏸️ **Disabled**
- No session logging features active
- Can be re-enabled anytime
- **Best for**: Users who prefer no automation

### **2. Analytics Board Configuration**

#### 📋 **Board Setup**
- **Board Name**: Customize your analytics board name
- **Workspace**: Choose which workspace hosts your analytics
- **Privacy**: Private (default) or shared with team
- **Columns**: Customize which metrics to track

#### 📊 **Tracked Metrics**
Choose which session data to capture:
- ✅ Session duration and message count
- ✅ AI models used and costs (when available)
- ✅ Session types (coding, writing, analysis, etc.)
- ✅ Productivity scores (1-5 rating)
- ✅ Key topics and outcomes
- ✅ Files modified (for coding sessions)
- ✅ Session links for easy access

### **3. Smart Prompt Settings**

#### 🧠 **Idle Detection**
- **Trigger Time**: How long to wait before offering session logging (5-30 minutes)
- **Message Threshold**: Minimum messages before considering a session "substantial" (3-20 messages)
- **Frequency**: Maximum prompts per hour (1-6 prompts)

#### 🎨 **Prompt Personality**
- **Llama Level**: Choose how playful the prompts are
  - 🦙 **Full Llama**: Maximum personality and fun
  - 😊 **Friendly**: Warm but professional
  - 📊 **Business**: Minimal personality, focus on data

### **4. Productivity Insights**

#### 📈 **Analytics Features**
- **Weekly Summaries**: Auto-generate weekly productivity reports
- **Model Comparison**: Track which AI models work best for you
- **Time Patterns**: Identify your most productive hours
- **Session Types**: See breakdown of coding vs. writing vs. analysis

#### 🎯 **Goals & Targets**
- Set monthly session targets
- Track productivity score improvements
- Monitor AI cost optimization
- Celebrate milestones and achievements

## 🚀 Quick Actions

### **Enable Auto-Logging**
Activate automatic session logging with optimized settings:
```
/monday-enable-auto-logging
```

### **Create Analytics Board**
Set up your session tracking board with recommended structure:
```
/monday-setup-analytics-board
```

### **Test Session Logging**
Create a demo session entry to see how it looks:
```
/monday-demo-session
```

### **View Analytics**
Open your session analytics board in monday.com:
```
/monday-view-analytics
```

### **Export Session Data**
Download your session data as CSV for external analysis:
```
/monday-export-sessions
```

## 🛠️ Advanced Configuration

### **Custom Templates**
Create custom session templates for different work types:
- Development sessions
- Content creation
- Client consultations
- Research projects
- Team collaborations

### **Integration Settings**
Connect with other tools for richer session data:
- **Git Integration**: Track commits and code changes
- **Calendar Sync**: Match sessions with calendar blocks
- **Time Tracking**: Integrate with tools like Toggl or Harvest
- **Slack Notifications**: Share session summaries with team

### **Privacy & Data**
- **Data Retention**: How long to keep session logs (30 days - forever)
- **Sharing Permissions**: Who can view your session analytics
- **Export Options**: Backup and export your session data
- **Deletion**: Remove specific sessions or clear all data

## 💡 Pro Tips

### **🎯 Getting the Most Value**
- Enable auto-logging for 2 weeks to build baseline data
- Review weekly summaries to identify productivity patterns
- Use session links to revisit successful problem-solving approaches
- Track cost per session to optimize AI model usage

### **🔧 Customization Ideas**
- Create separate boards for different projects
- Set up automations to notify team of major milestones
- Use tags to categorize sessions by client or project
- Create dashboards showing team AI productivity trends

### **🚀 Power User Features**
- Set up webhooks to trigger actions based on session data
- Create custom formulas to calculate ROI on AI usage
- Build reports showing productivity improvement over time
- Integrate with BI tools for advanced analytics

---

**Ready to optimize your AI productivity tracking?**

Use the configuration options above or run `/monday-session-wizard` for a guided setup experience!

Remember: Great session logging leads to great insights! 📊✨