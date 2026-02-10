---
pubDate: 2020-04-16
title: "speech2speech summarizer"
technologies: ["Python", "Machine Learning", "NLP"]
description: "a tool for summarizing spoken language into concise audio summaries."
---

Takes spoken audio, transcribes it, summarises it, and reads the summary back to you. Built for things like meeting recordings and lecture transcriptions where you want the gist without re-listening to the whole thing.

### How it works

1. **Audio analysis** — uses librosa to extract features like pitch, volume, and speaking rate. Segments where the speaker emphasises something (louder, slower, pitch changes) get flagged as more important
2. **Summarisation** — runs both extractive (TextRank) and abstractive (fine-tuned T5 transformer) approaches. The emphasis markers feed into both to weight important segments higher
3. **Text-to-speech** — converts the summary back to audio, preserving some of the original emphasis and intonation

### What I found

I ran a comparison study between the two summarisation approaches. Extractive summaries preserved the original phrasing but felt disjointed. Abstractive summaries were more coherent but sometimes missed nuance. A hybrid of both worked best.

[Source code on GitHub](https://github.com/dgrah50/speech2speech_summ).
