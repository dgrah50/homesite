---
pubDate: 2020-07-16
title: "f# ecommerce site"
technologies: ["F#", "React", "Redux", "MongoDB"]
description: "an e-commerce site built with React and Redux on the frontend and F# on the backend."
---

A full-stack e-commerce site with a React/Redux frontend and an F# backend. I built this to see what it's like to write a REST API in a functional language.

### Stack

- **Backend** — F# with the Giraffe web framework, serving a REST API
- **Frontend** — React with Redux for state management
- **Database** — MongoDB for item data

### What I learned

Coming from Python and JavaScript, F# was a big shift. Pattern matching, discriminated unions, and immutability-by-default felt alien at first but made the code surprisingly expressive. The strong type system caught a lot of bugs at compile time that I'd normally only find at runtime.

The most interesting part was noticing how Redux on the frontend mirrors functional state management on the backend — pure reducers, immutable state, actions in / state out. Working in F# made that connection click.

[Source code on GitHub](https://github.com/dgrah50/fsharp-ecommerce).
