---
pubDate: 2019-07-16
title: "lifeline"
technologies: ["JavaScript", "HTML", "CSS", "Python"]
description: "a low-cost remote patient monitoring system."
---

LifeLine is a low-cost vital sign monitor built on a Raspberry Pi. It streams patient data to a web dashboard in real-time and uses a deep learning model to detect atrial fibrillation from ECG signals.

This was a university group project. The goal was to build something cheap enough for developing countries but capable enough to actually be useful — live monitoring, remote access, and automated alerts.

### Hardware

Custom Raspberry Pi HAT with modular sensor connections:

- **ECG** — AD8232 sensor
- **PPG** (blood oxygen) — MAX30102
- **Temperature** — DS18B20
- **Respiration** — derived from ECG data in software
- Medical-grade isolated power supply for patient safety
- Each sensor runs as its own Python process for independent operation

### Web dashboard

- Real-time vitals displayed bedside on an LCD and streamed to Firebase
- Doctors can monitor multiple patients remotely and view history
- Built with vanilla HTML/CSS/JS and Firebase Realtime Database + Auth

### AF detection model

- ResNet-style CNN trained on the PhysioNet CinCC 2017 dataset (8,500 ECG recordings)
- Scaled to ~1/5th the reference model size to run on an Intel Neural Compute Stick
- Input: 30s ECG at 300Hz, normalised to zero mean / unit variance
- Achieved 75% accuracy and 0.81 AUC (target was 65%)

[Project wiki on GitHub](https://github.com/anujaagaitonde/Bedside-Monitor/wiki).
