---
pubDate: 2023-07-16
title: "sendwiz"
technologies: ["Swift", "iOS", "Python", "FastAPI"]
description: "schedule imessage + whatsapp with ai"
---

Sendwiz lets you compose messages with AI and schedule them from your iPhone. Never forget a birthday text or a follow-up. Messages are sent using your number, whenever you want.

I built this because I kept forgetting to text people at the right time. The idea: write the message now (or let AI draft it), schedule it, and forget about it.

### How it works

- **iOS app** (Swift/SwiftUI) — compose, schedule, and manage messages. Uses the native iMessage framework to send on your behalf
- **Backend** (FastAPI/Python) — handles auth, scheduling queue, and AI message generation via OpenAI
- **Database** (PostgreSQL) — stores users, scheduled messages, and conversation context
- JWT auth, rate limiting on the AI endpoint, and HTTPS throughout

[Source code on GitHub](https://github.com/sendwiz/sendwiz-ios) and [backend](https://github.com/sendwiz/sendwiz-backend).
