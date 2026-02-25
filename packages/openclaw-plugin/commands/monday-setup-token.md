---
name: monday-setup-token
description: Step-by-step guide to get and configure your monday.com API token
category: setup
icon: 🔑
---

# monday.com API Token Setup

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

       🦙 Token Setup Guide! 🦙
```

Need help getting your monday.com API token? I'll walk you through it step by step!

## 🎯 Quick Overview

Your API token is like a key that lets me access your monday.com account safely. You only need to set this up once!

**⏱️ Time needed**: 2-3 minutes
**🔒 Security**: Your token stays private and secure
**💰 Cost**: Free (works with monday.com free plan)

## 📋 Step-by-Step Guide

### **Step 1: Access monday.com**
1. Go to **[monday.com](https://monday.com)** in your browser
2. **Log in** with your account (or create a free account if needed)
3. Make sure you're logged in and can see your workspace

### **Step 2: Open Developer Settings**
1. **Find your avatar** (profile picture) in the **bottom-left corner**
2. **Click your avatar** - a menu will appear
3. **Select "Developers"** from the menu (look for the `</>` icon)

### **Step 3: Generate Your Token**
1. Click on **"My Access Tokens"** tab
2. Click **"Generate"** or **"Create New Token"**
3. **Name your token**: Enter something like `OpenClaw Plugin`
4. **Click "Create"** to generate the token

### **Step 4: Copy Your Token**
1. **Click "Show"** to reveal your token
2. **Copy the entire token** (it's long - about 200+ characters!)
3. **Save it somewhere safe** (password manager recommended)

⚠️ **Important**: Your token is like a password - never share it or commit it to git!

## ⚙️ Configuration Options

Choose the method that works best for you:

### **🥇 Method 1: Environment Variable (Recommended)**

**Why this is best:**
- ✅ Most secure approach
- ✅ Works across all OpenClaw projects
- ✅ Easy to update or rotate tokens

**How to set it up:**

**For Bash users:**
```bash
echo 'export MONDAY_API_TOKEN="YOUR_TOKEN_HERE"' >> ~/.bashrc
source ~/.bashrc
```

**For Zsh users:**
```bash
echo 'export MONDAY_API_TOKEN="YOUR_TOKEN_HERE"' >> ~/.zshrc
source ~/.zshrc
```

**For Windows users:**
```cmd
setx MONDAY_API_TOKEN "YOUR_TOKEN_HERE"
```

### **🥈 Method 2: OpenClaw Command**

**Quick one-liner:**
```bash
openclaw config set plugins.monday-com.apiToken "YOUR_TOKEN_HERE"
```

**Verify it worked:**
```bash
openclaw config get plugins.monday-com.apiToken
```

### **🥉 Method 3: Direct Config File**

**Edit your OpenClaw config file** (`~/.openclaw/config.json`):
```json
{
  "plugins": {
    "monday-com": {
      "apiToken": "YOUR_TOKEN_HERE"
    }
  }
}
```

## ✅ Testing Your Setup

After configuring your token, test it works:

```bash
# Run any monday.com command to test
/monday-quick-start
```

If everything is working, you'll see your monday.com account info!

## 🆘 Troubleshooting

### **❌ "Invalid token" error**
- **Double-check**: Did you copy the entire token?
- **Check spaces**: Remove any extra spaces at beginning/end
- **Try fresh**: Generate a new token in monday.com
- **Verify account**: Make sure you're using the right monday.com account

### **❌ "Token not found" error**
- **Check method**: Verify you used the right configuration method
- **Restart**: Restart OpenClaw after setting environment variables
- **Check syntax**: Make sure quotes are correct in config files

### **❌ "Permission denied" error**
- **Check account**: Make sure your monday.com account has proper permissions
- **Try admin**: If using a work account, you might need admin approval
- **Generate fresh**: Create a new token with a different name

## 🔒 Security Best Practices

### **✅ Do This:**
- Store tokens in environment variables or secure config
- Use password managers to store backup copies
- Rotate tokens periodically (every 6-12 months)
- Use descriptive token names in monday.com

### **❌ Don't Do This:**
- Never commit tokens to git repositories
- Don't share tokens in chat/email
- Don't store tokens in plain text files
- Don't use the same token across multiple services

## 🆕 Don't Have a monday.com Account Yet?

No problem! monday.com offers a **free plan** perfect for getting started:

### **Quick Signup:**
1. Go to **[monday.com/signup](https://monday.com/signup)**
2. Choose **free plan** (no credit card required)
3. Verify your email and complete setup
4. Come back and follow the token setup guide above!

### **Free Plan Includes:**
- ✅ Up to 2 team members
- ✅ Unlimited personal boards
- ✅ Basic integrations
- ✅ Mobile apps
- ✅ Full API access (what we need!)

## 🚀 What's Next?

Once your token is configured, you can:

### **🧙‍♂️ Try Interactive Wizards:**
- `/monday-create-board` - Create boards with smart templates
- `/monday-setup-project` - Complete project environment setup
- `/monday-setup-sprint` - Agile sprint board creation
- `/monday-setup-crm` - Sales pipeline and CRM setup

### **📊 Enable Advanced Features:**
- `/monday-session-settings` - Auto-log your AI sessions
- `/monday-whatsapp-sync` - Sync WhatsApp contacts (if applicable)

### **🎯 Get Started:**
- `/monday-quick-start` - Choose the perfect workflow for your needs

## 💡 Pro Tips

### **🎯 Token Management:**
- **Name your tokens clearly**: "OpenClaw - MacBook Pro", "OpenClaw - Work Setup"
- **Keep a backup**: Store a copy in your password manager
- **Regular rotation**: Update tokens every 6-12 months for security

### **🚀 Getting the Most Value:**
- Start with `/monday-quick-start` to find the right workflow
- Enable session logging to track your AI productivity
- Use interactive wizards instead of manual board creation
- Explore advanced features after mastering the basics

---

**🦙 Need more help?**

Run `/monday-help` for quick reference or `/monday-quick-start` to begin your monday.com journey!

Your API token is the key to unlocking amazing productivity features! 🔑✨