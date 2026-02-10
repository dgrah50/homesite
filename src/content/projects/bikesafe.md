---
pubDate: 2018-07-16
title: "bikesafe"
technologies: ["C++", "Arduino", "GSM", "GPS", "Accelerometer"]
description: "a gps tracker that can be concealed in a bike frame"
---

A GPS tracker small enough to hide inside a bike's seat tube. If someone moves your bike, you get an SMS with its location.

The idea came from how poor stolen bike recovery rates are. If you can track it in real-time without the thief knowing, you've got a much better chance of getting it back.

### How it works

- **ESP8266** runs the show — reads sensors, manages power, sends alerts
- **GPS module** tracks location
- **Accelerometer** detects movement (i.e. someone picking up your bike)
- **GSM module** sends SMS alerts and streams location data to a companion Android app
- The whole thing runs on a rechargeable battery with aggressive sleep modes to last as long as possible

The companion app overlays the bike's location on a map in real-time.

[Android app on GitHub](https://github.com/rahulberry/BikeSafe).
