---
layout: ../../layouts/BlogLayout.astro
pubDate: 2020-07-16
title: "f# ecommerce site"
technologies: ["F#", "React", "Redux", "MongoDB"]
description: "an e-commerce site built with React and Redux on the frontend and F# on the backend."
---

An e-commerce site built with React and Redux on the frontend and F# on the backend.

This project was a challenge to see if I could make a REST API in a functional language, choosing F# with the Giraffe web framework. The backend uses a NoSQL database in MongoDB to store item details. On the frontend, React with Redux is used for state management. This project helped me learn state management in a functional programming context.


### Key Learnings

As someone primarily experienced with Python and JavaScript, this project provided me with several valuable learning experiences:

1. **Functional Programming Paradigm**: Working with F#, a functional-first language, was a significant shift from my usual object-oriented and imperative styles. I learned about:
   - The benefits of immutability in managing state
   - How to use higher-order functions and function composition effectively
   - Implementing elegant control flow through pattern matching

2. **Strong Static Typing**: Unlike my experience with Python and JavaScript, F#'s strong, static type system introduced me to:
   - Type inference, allowing me to write concise code without sacrificing type safety
   - Using discriminated unions and record types to model domain entities
   - The advantages of catching errors at compile-time rather than runtime

3. **Asynchronous Programming in F#**: While I was familiar with async/await in JavaScript, F#'s async workflows gave me a fresh perspective on handling asynchronous operations.

4. **Domain-Driven Design (DDD)**: F#'s suitability for DDD exposed me to:
   - Modeling the domain using types
   - Creating a ubiquitous language that bridges code and business requirements

5. **Functional Web Development**: Using Giraffe showed me how functional concepts apply to web development, contrasting with my experience in Express.js or Flask.

6. **Functional State Management**: Using Redux on the frontend, I noticed parallels with functional state management on the backend, which reinforced my understanding of functional programming principles.

7. **NoSQL with F#**: Interacting with MongoDB from F# demonstrated how I could apply functional programming concepts to database operations.

8. **Cross-Paradigm Development**: Building a full-stack application with a functional backend (F#) and a more imperative frontend (JavaScript/React) highlighted for me the strengths and challenges of each approach.

[More details can be found here](https://dayangrah.am/work/f-ecommerce-site).
