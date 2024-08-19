---
layout: ../../layouts/BlogLayout.astro
pubDate: 2020-07-16
title: "serena"
technologies: ["React Native", "Node.js"]
description: "a Bible verse recommendation app."
---

An app that uses NLP to find a Bible verse relevant to anything that you say. Built with React Native and Node.js.


Open the app and say anything on your mind; Serena will find a relevant Bible verse and podcast. The app, written in React Native, creates both iPhone and Android apps from a single codebase. The backend, written in Node.js, uses Word2Vec embeddings to perform a cosine similarity search among 5000 distinct topics, returning a relevant verse over the API. It also learns from past searches to recommend relevant verses and podcasts.


### Technical Details

Building Serena involved several key technical components:

1. **React Native Frontend**: 
   - Utilized React Native for cross-platform development, allowing a single codebase to generate both iOS and Android apps.
   - Implemented a clean, intuitive UI for user input and verse display.
   - Integrated speech-to-text functionality for seamless user interaction.

2. **Node.js Backend**:
   - Developed a robust API using Express.js to handle requests from the mobile app.
   - Implemented Natural Language Processing (NLP) techniques:
     - Used Word2Vec embeddings to convert user input and Bible verses into vector representations.
     - Employed cosine similarity calculations to find the most relevant verses based on user input.

3. **Database and Caching**:
   - Stored Bible verses and their corresponding vector representations in a database for quick retrieval.
   - Implemented caching mechanisms to improve response times for frequently requested verses.

4. **Word2Vec Implementation**:
   - Utilized the Word2Vec model, a two-layer neural network that processes text and outputs vector representations of words.
   - Pre-trained the Word2Vec model on a large corpus of religious texts to capture semantic relationships specific to biblical language.
   - Implemented a custom tokenization process to handle biblical names and phrases effectively.
   - Used the Gensim library in Python to train and manage the Word2Vec model.
   - Optimized the model to balance between accuracy and performance, considering the app's real-time response requirements.

5. **API Design**:
   - Created RESTful endpoints for verse retrieval, podcast recommendations, and user history synchronization.
   - Implemented proper error handling and response formatting for a smooth user experience.

6. **Performance Optimization**:
   - Optimized the similarity search algorithm to handle a large dataset of 5000 distinct topics efficiently.
   - Implemented lazy loading and pagination techniques to manage large sets of verses and podcasts.

7. **Security Measures**:
   - Implemented secure API authentication to protect user data and prevent unauthorized access.
   - Ensured proper data sanitization to prevent injection attacks.

These technical aspects combined to create a responsive, intelligent, and user-friendly Bible verse recommendation app that leverages advanced NLP techniques to provide relevant suggestions.





### Video

<iframe width="560" height="315" src="https://www.youtube.com/embed/8H6kkG4PlqA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

[More details can be found here](https://dayangrah.am/work/serena).
