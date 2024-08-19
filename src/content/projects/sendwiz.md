---
layout: ../../layouts/BlogLayout.astro
pubDate: 2023-07-16
title: "sendwiz"
technologies: ["Swift", "iOS", "Node.js", "Express"]
description: "schedule imessage + whatsapp with ai"
---

Compose messages with AI and schedule them from your iPhone. Never forget a birthday or a follow-up message. With Sendwiz, you can schedule iMessages and WhatsApp messages directly on your iPhone. Messages are sent using your number, whenever you want.

Sendwiz offers a seamless way to compose and schedule messages using AI. Users can easily schedule messages for later delivery, ensuring timely communication without manual effort. The app handles various scenarios, such as reminders for birthdays or follow-up messages.


### Technical Implementation

Sendwiz is built with a robust tech stack, combining modern frontend and backend technologies to deliver a seamless user experience.

1. **iOS App (Swift)**:
   - Developed using Swift, Apple's powerful and intuitive programming language for iOS.
   - Utilized SwiftUI for building the user interface, enabling a responsive and native iOS look and feel.
   - Implemented local notifications to remind users of scheduled messages.
   - Integrated with iOS's native iMessage framework for sending scheduled messages.
   - Used URLSession for network requests to the backend API.

2. **Backend (FastAPI and Python)**:
   - Built with FastAPI, a modern, fast (high-performance) web framework for building APIs with Python 3.6+.
   - Leveraged FastAPI's asynchronous request handling for improved performance and scalability.
   - Implemented RESTful API endpoints for user authentication, message scheduling, and AI-powered message generation.

3. **Database (PostgreSQL)**:
   - Utilized PostgreSQL as the primary database for its robustness and support for complex queries.
   - Designed schemas to efficiently store user data, scheduled messages, and AI-generated content.
   - Implemented database migrations for version control of the database schema.

4. **AI Integration (OpenAI)**:
   - Integrated OpenAI's GPT models for AI-powered message composition.
   - Implemented prompt engineering techniques to generate contextually relevant and personalized messages.
   - Used OpenAI's API to send requests and receive AI-generated responses asynchronously.

5. **Security and Authentication**:
   - Implemented JWT (JSON Web Tokens) for secure user authentication and authorization.
   - Utilized HTTPS encryption for all API communications.
   - Implemented rate limiting to prevent abuse of the AI generation feature.

6. **Message Scheduling System**:
   - Developed a robust scheduling system using Python's asyncio for handling asynchronous tasks.
   - Implemented a queue system to manage and process scheduled messages efficiently.



[More details can be found here](https://github.com/sendwiz/sendwiz-ios) and [here](https://github.com/sendwiz/sendwiz-backend).
