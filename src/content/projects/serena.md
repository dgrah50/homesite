---
pubDate: 2020-07-16
title: "serena"
technologies: ["React Native", "Node.js"]
description: "a Bible verse recommendation app."
---

Say anything on your mind and Serena finds a relevant Bible verse and podcast. Built with React Native and a Node.js backend.

The app uses Word2Vec embeddings to convert what you say into a vector, then runs cosine similarity against 5000+ distinct topics to find the best match. It also learns from past searches to improve recommendations over time.

### Stack

- **Frontend** (React Native) — cross-platform iOS/Android from a single codebase, with speech-to-text input
- **Backend** (Node.js/Express) — serves the similarity search API and handles recommendation logic
- **NLP** — Word2Vec model pre-trained on religious texts via Gensim, with custom tokenisation for biblical names and phrases
- Results are cached for common queries to keep responses fast
