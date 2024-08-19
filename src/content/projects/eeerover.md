---
layout: ../../layouts/BlogLayout.astro
pubDate: 2016-07-16
title: "eeerover"
technologies: ["C++", "Arduino", "ESP8266", "Custom PCB"]
description: "a rugged-terrain rover with custom-made sensors."
---

### Project Overview

The EEERover is a rugged-terrain rover developed as part of a university project. It detects various signals (infrared, RF, acoustic) and relays information via wifi to a mobile phone. The project uses an ESP8266 IoT platform, custom PCBs, and an H-bridge motor controller. The rover can detect radio signals, ultrasound signals, infrared pulses, and magnetic fields. The ESP8266 module is programmed with C++ code through the Arduino interface.

1. Radio signals
2. Ultrasound signals
3. Infrared pulses
4. Magnetic fields

Each rock was designed to emit two of these properties, challenging the rover's sensing capabilities.

### Key Design Requirements

1. **Remote Control**: The rover had to be controllable via a WiFi network, allowing for remote operation.
2. **Size and Weight**: Designed to fit through a minimum gap of 300mm, emphasizing compact size and lightweight construction.
3. **Maneuverability**: High maneuverability was crucial for optimal sensor positioning relative to the rocks.
4. **Cost-Effective**: The project had a strict budget limit of £50.
5. **Reliability**: Both the sensing system and physical construction needed to be highly reliable.
6. **User-Friendly Control**: The interface for controlling the rover had to be intuitive and easy to use.

### Technical Challenges

The project presented several technical challenges:

1. **Sensor Integration**: Incorporating multiple sensors (RF, ultrasound, infrared, and magnetic) into a compact design.
2. **Wireless Communication**: Implementing stable WiFi communication for remote control and data transmission.
3. **Power Management**: Balancing power consumption with performance requirements within the size and weight constraints.
4. **Signal Processing**: Developing algorithms to accurately interpret and distinguish between different rock properties.
5. **Mechanical Design**: Creating a rugged chassis capable of navigating varied terrain while maintaining sensor alignment.

The EEERover project successfully met these challenges, resulting in a functional prototype that demonstrated the feasibility of using multi-sensor rovers for mineral identification in remote or hazardous environments.



[More details can be found here](https://dayangrah.am/work/eeerover).
