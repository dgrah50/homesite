---
pubDate: 2024-01-16
title: "contributions to openreplay"
technologies: ["JavaScript", "TypeScript", "Open Source"]
description: "an open-source session replay suite for developers."
---

OpenReplay is an open-source session replay suite for developers. I contributed several PRs across auth, security, deployment, and bug fixes.

### Contributions

- **Windows Integrated Auth for SAML** — added enterprise SSO support ([#1072](https://github.com/openreplay/openreplay/pull/1072))
- **Mutual TLS for assets service** — encrypted asset delivery ([#1034](https://github.com/openreplay/openreplay/pull/1034))
- **Kerberos auth for Kafka** — secured backend event streaming ([#807](https://github.com/openreplay/openreplay/pull/807))
- **SSL verification toggle** — more flexibility for Chalice API deployments ([#1057](https://github.com/openreplay/openreplay/pull/1057))
- **WebWorker crash fix** — resolved crash from uninitialised sender/writer ([#1027](https://github.com/openreplay/openreplay/pull/1027))
- **Tracker resource cleanup** — fixed memory leak on control release ([#782](https://github.com/openreplay/openreplay/pull/782)) and remote control session cleanup ([#780](https://github.com/openreplay/openreplay/pull/780))
- **Assist overlay IDs** — added element IDs for easier CSS targeting ([#747](https://github.com/openreplay/openreplay/pull/747), [#744](https://github.com/openreplay/openreplay/pull/744))

[OpenReplay on GitHub](https://github.com/openreplay/openreplay).
