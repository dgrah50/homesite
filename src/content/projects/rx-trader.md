---
pubDate: 2026-02-09
title: "rx-trader"
technologies: ["TypeScript", "RxJS", "Bun", "WebSocket"]
description: "reactive, event-sourced crypto trading engine"
---

rx-trader is a thought experiment: what happens when you model an entire crypto trading system as reactive streams?

It's an event-sourced, RxJS-powered trading engine built with Bun and TypeScript. The core idea is that every stage of the trading pipeline — from tick ingestion to order execution — is an observable composition. Business logic stays pure; side effects live at the edges. One process, one event loop, zero microservice sprawl.

### The Experiment

The hypothesis: reactive streams are a natural fit for trading systems. Ticks are streams. Signals are derived streams. Risk filters are operators. Execution is a subscriber. The same code can run backtests, paper trading, and live trading by swapping dependencies at the edges.

```
feeds.ticks$
  -> strategies.signals$
  -> intentBuilder(signals$, marks$)
  -> riskFilter.check(intents$)
  -> execution.submit(approved$)
  -> execution.fills$
  -> portfolio.snapshots$
```

Everything is an event. Every event is persisted. Every view is a replay.

### Architecture

![rx-trader architecture](/images/projects/rx-trader-arch.svg)

The system splits into two data planes:

**Hot path (RxJS observables)** handles the trading-critical flow. Ticks stream through strategies, intent shaping, risk filters, and execution as direct observable chains. Sub-millisecond latency, compile-time type safety, backpressure control via operators like `throttle`, `buffer`, and `sample`.

**Cold path (EventBus)** handles observability. Every significant state transition is emitted as a domain event for persistence, dashboard updates, and the audit trail. Heavy I/O stays off the hot path entirely.

### Packages

- **core** — Domain types (Zod schemas), event definitions, time abstractions
- **feeds** — WebSocket adapters (Binance, Hyperliquid), sentiment feed
- **strategies** — Strategy registry, DSL operators (rolling stats, z-scores, crossovers, cooldowns)
- **risk** — Pre-trade and post-trade risk modules
- **execution** — Paper adapter, REST venue gateways, retry/circuit breaker policy
- **pipeline** — Feed manager, strategy orchestrator, execution manager, intent reconciliation
- **portfolio** — Position/PnL analytics, balance sync, accounting

[Source code on GitHub](https://github.com/dgrah50/rx-trader).
