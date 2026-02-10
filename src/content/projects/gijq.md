---
pubDate: 2026-02-09
title: "gijq"
technologies: ["Go", "TUI"]
description: "interactive jq playground for the terminal"
---

gijq is a terminal-based jq explorer that lets you interactively build and test jq filters against JSON data with instant feedback.

<video autoplay loop muted playsinline style="width:100%;border-radius:8px">
  <source src="/images/projects/gijq-demo.mp4" type="video/mp4" />
</video>

I built it because the jq feedback loop is slow — you write a filter, run it, check the output, tweak, repeat. gijq collapses that into a live editing experience where results update as you type.

### Features

- **Live filtering** — results update as you type any valid jq expression
- **Tab completion** — press Tab to cycle through available keys at the current path, including nested objects, arrays, and pipe expressions
- **Split-pane layout** — JSON output on the left, available keys on the right
- **Query history** — per-file history accessible via Ctrl+H, persisted across sessions
- **Clipboard support** — copy output or filter to clipboard, with OSC52 fallback for SSH sessions
- **Syntax highlighting** — keys, strings, numbers, booleans, and nulls are color-coded
- **Pipeline-friendly** — press Enter to output the current result to stdout and exit

### Usage

```bash
# From a file
gijq api-response.json

# From a pipe
curl -s https://api.example.com/data | gijq
```

Built with Go 1.24+ using Bubble Tea for the TUI framework.

[Source code on GitHub](https://github.com/dgrah50/gijq).
