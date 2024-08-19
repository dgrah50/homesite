---
layout: ../../layouts/BlogLayout.astro
pubDate: 2018-07-16
title: "bikesafe"
technologies: ["C++", "Arduino", "GSM", "GPS", "Accelerometer"]
description: "a gps tracker that can be concealed in a bike frame"
---

BikeSafe aims to improve recovery rates for stolen bicycles. The prototype, installed in the seat tube, uses GPS and accelerometer data to detect theft. GSM communication sends alerts to the user’s phone, and an app overlays the bike's location data on a map. The project includes a custom Android app for tracking, which can be found on [GitHub](https://github.com/rahulberry/BikeSafe).


### Hardware Implementation

The BikeSafe prototype leverages a combination of powerful and compact hardware components to achieve its tracking and communication capabilities:

1. **ESP8266 Microcontroller**: 
   - Serves as the brain of the system, coordinating all other components.
   - Chosen for its small form factor and built-in Wi-Fi capabilities, allowing for future expansion of connectivity options.

2. **GSM Module**:
   - Enables cellular communication for sending alerts and location data.
   - Provides wide-range connectivity, ensuring the device can communicate even in areas without Wi-Fi.

3. **GPS Module**:
   - Accurately determines the bicycle's location.
   - Provides real-time tracking data that can be transmitted to the user's phone.

4. **Accelerometer**:
   - Detects sudden movements or changes in orientation.
   - Crucial for identifying potential theft attempts.

5. **Power Management**:
   - Incorporates a compact, rechargeable battery.
   - Implements power-saving techniques to extend battery life, such as sleep modes when the bike is stationary.

The hardware components are carefully integrated to fit within the confined space of a bicycle seat tube, making the device both discreet and protected from external elements. This compact design, coupled with the low-power consumption of the ESP8266, allows for extended operation without frequent charging, making BikeSafe a practical solution for long-term bicycle security.

