---
layout: ../../layouts/BlogLayout.astro
pubDate: 2024-07-16
title: "Serena"
technologies: ["React Native", "Node.js"]
---

## Serena

### What is it?

An app that uses NLP to find a Bible verse relevant to anything that you say. Built with React Native and Node.js.

### More Info

Open the app and say anything on your mind; Serena will find a relevant Bible verse and podcast. The app, written in React Native, creates both iPhone and Android apps from a single codebase. The backend, written in Node.js, uses Word2Vec embeddings to perform a cosine similarity search among 5000 distinct topics, returning a relevant verse over the API. It also learns from past searches to recommend relevant verses and podcasts.

### Video

<iframe width="560" height="315" src="https://www.youtube.com/embed/8H6kkG4PlqA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

[More details can be found here](https://dayangrah.am/work/serena).
