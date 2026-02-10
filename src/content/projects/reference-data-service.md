---
pubDate: 2026-01-27
title: "reference data service"
technologies: ["Python", "FastAPI", "WebSocket"]
description: "multi-exchange crypto reference data aggregator"
---

A service that aggregates and normalises reference data from multiple cryptocurrency exchanges into a unified data model.

When working across multiple exchanges, each one has its own way of representing trading pairs, tick sizes, and instrument metadata. This service pulls it all together into a consistent format so downstream systems don't have to deal with the differences.

### Supported exchanges

- Binance
- Bitget
- Bybit
- Coinbase
- Coinbase International
- OKX

### Features

- Fetches and normalises reference data from multiple exchanges
- Provides a unified data model for trading pairs and exchange information
- REST API for retrieving full snapshots
- WebSocket API for real-time updates
- Circuit breaker pattern for fault tolerance
- Rate limiting for API calls
- Configurable exchange watchers

Built with Python, FastAPI, and async-first throughout.

[Source code on GitHub](https://github.com/dgrah50/reference-data-service).
