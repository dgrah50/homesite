---
pubDate: 2016-07-16
title: "eeerover"
technologies: ["C++", "Arduino", "ESP8266", "Custom PCB"]
description: "a rugged-terrain rover with custom-made sensors."
---

A WiFi-controlled rover built for a first-year university project. The task: navigate rough terrain and identify "rocks" by detecting the signals they emit — RF, ultrasound, infrared, and magnetic fields. Each rock emitted two of these, and you had to figure out which.

### Constraints

- Had to fit through a 300mm gap
- Budget: £50
- Controlled remotely over WiFi via a phone

### How we built it

- **ESP8266** as the brain, programmed in C++ through the Arduino interface
- **Custom PCBs** for sensor interfacing
- **H-bridge motor controller** for driving
- Four sensor types: RF receiver, ultrasonic transducer, IR detector, magnetometer
- Data relayed over WiFi to a mobile phone in real-time

The hardest part was cramming all those sensors into something small enough to fit the size constraint while keeping the sensor readings reliable. Power management was also tricky — balancing the ESP8266, motors, and sensors on limited battery.

[Source code on GitHub](https://github.com/dgrah50/eeerover).
