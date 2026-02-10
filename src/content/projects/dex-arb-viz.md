---
pubDate: 2025-02-02
title: "dex arb viz"
technologies: ["TypeScript", "React", "RxJS", "WebSocket"]
description: "real-time cross-dex price comparison dashboard"
---

A real-time price comparison dashboard between Reya Network and Hyperliquid DEX perpetual markets, with spread visualisation and historical tracking.

I wanted a way to quickly spot pricing discrepancies between decentralised exchanges. This dashboard streams live data from both and makes it easy to see where spreads diverge.

### What it does

- Streams live prices from both Reya and Hyperliquid for common trading pairs
- Displays a real-time comparison grid showing prices from each exchange side-by-side
- Calculates and visualises the spread between the two exchanges
- Tracks spread history over time with interactive charts

### Architecture

![dex-arb-viz architecture](/images/projects/dex-arb-viz-arch.svg)

- **Backend** (Express + WebSocket): Connects to both Reya (WebSocket via `@reyaxyz/api-sdk`) and Hyperliquid (REST polling) APIs, merges price streams using RxJS, and pushes updates to the frontend over a single WebSocket connection.
- **Frontend** (React + Vite): Displays prices in an AG Grid table with spread heatmapping, and uses Highcharts for historical spread charts. State managed with Zustand.

[Source code on GitHub](https://github.com/dgrah50/dex-arb-viz).
