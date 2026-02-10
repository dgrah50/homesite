---
pubDate: 2024-07-16
title: "aisms"
technologies: ["Python", "Machine Learning", "SMS"]
description: "ai for dumbphones"
---

AISMS is an AI-powered SMS system that brings llms to dumbphones.

For a few months in 2024, I switched to using a dumbphone to escape doomscrolling and to generally unplug. However, I missed quick access to info and also the phone I was using didn't have navigation capabilities. 

AISMS is a simple python application that uses a twilio phone number to receive SMS messages and uses openai + google maps api to generate responses to make dumbphone life a bit easier.


### How it works

![aisms architecture](/images/projects/aisms-arch.svg)

1. You text the Twilio number from any phone
2. FastAPI webhook receives the SMS
3. LangChain + OpenAI processes the message — if it's a location query, it hits the Google Maps API
4. Conversation history is persisted via Tortoise ORM
5. Response is sent back as an SMS

### Stack

- **FastAPI + Uvicorn** — async webhook server
- **Twilio** — SMS send/receive
- **LangChain + OpenAI** — message understanding and response generation
- **Google Maps** — directions and location lookups
- **Tortoise ORM** — async database for conversation history


[More details can be found here](https://github.com/dgrah50/aisms).
