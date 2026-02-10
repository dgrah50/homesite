---
pubDate: 2024-08-13
title: "concurrency"
description: "the art of doing many things at once"
---

I work with async code every day — promises, event loops, coroutines. That side of concurrency I'm comfortable with. But threading and parallelism? That's where my understanding gets thin.

JavaScript and Python make it easy to never think about threads. The runtimes handle it for you, and most of the time that's fine. But it means I've never had to reason about shared memory, mutexes, or what actually happens when two threads hit the same data at the same time. No CS degree means I never got the OS-level fundamentals that make this stuff intuitive.

I want to fix that. Not to become a systems programmer, but because understanding what's happening below the abstractions makes you better at using them.

### Resources I'm working through

[Computer Systems: A Programmer's Perspective](https://csapp.cs.cmu.edu/)
[Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/)
