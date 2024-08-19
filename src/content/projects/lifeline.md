---
layout: ../../layouts/BlogLayout.astro
pubDate: 2019-07-16
title: "lifeline"
technologies: ["JavaScript", "HTML", "CSS", "Python"]
description: "a low-cost remote patient monitoring system."
---

LifeLine is a low-cost Internet-of-Things vital sign monitor with real-time illness prediction, allowing doctors to remotely monitor several patients in different locations. Custom circuitry interfaces sensors to measure vital signs with any Raspberry Pi. Sensor data is displayed live on a bedside monitor and live-streamed to a cloud-based database. A web app enables doctors to monitor patients live and view patient history. Data is processed by a machine learning algorithm to detect and predict critical events. The website uses HTML, CSS, and vanilla JavaScript, while the backend employs Google’s Firebase RealTime Database and Firebase Authentication.


### Hardware Implementation

LifeLine's hardware design focuses on modularity, cost-effectiveness, and medical-grade safety. Here's a summary of the key aspects:

1. **Platform Selection**: 
   - Chose Raspberry Pi Model 3b+ with LCD and Intel Compute Stick 2 for enhanced computing power.
   - This setup enables offline machine learning for heart abnormality prediction.

2. **Sensor Suite**:
   - ECG: AD8232 sensor (replacing initial ADS1292R due to compatibility issues).
   - PPG: Custom implementation using MAX30102, replacing commercial pulse oximeter.
   - Temperature: DS18B20 sensor.
   - Respiration: Software-derived from ECG data.

3. **Custom PCB Design**:
   - Developed a Raspberry Pi HAT (Hardware Attached on Top) for sensor interfacing.
   - Implemented 3.5mm headphone jacks for modular sensor connectivity.
   - Allows flexible configuration based on specific monitoring needs.

4. **Power and Safety**:
   - Utilized a medical-grade 5V/2.5A isolated USB wall power adapter for mains isolation.

5. **Modular Software Architecture**:
   - Employed Python's multiprocessing library for concurrent sensor data handling.
   - Separate processes for each sensor (temperature, PPG, ECG, respiration) ensure independent operation.
   - Additional processes for data processing and database communication.

6. **Display Integration**:
   - Incorporated LCD for local data visualization, enhancing usability for both patients and nearby medical staff.

7. **Future Improvements**:
   - Identified need for safer sensor connection mechanism to prevent potential short-circuiting during hot-plugging.
   - Considering 3.5mm switching jack sockets for enhanced safety in future iterations.


### Deep Learning Model Implementation

The LifeLine monitor incorporates a deep learning model for atrial fibrillation (AF) detection from ECG signals, a crucial feature in vital sign monitoring. Here's a summary of the implementation:

1. **Dataset**:
   - Utilized the PhysioNet/Computing in Cardiology Challenge (CinCC) 2017 dataset.
   - 8,500 ECG recordings, each 30-60 seconds long.
   - Four classes: Atrial fibrillation (AF), Normal rhythm (N), Other rhythm (O), and Noisy (~).

2. **Model Architecture**:
   - Based on the convolutional neural network proposed by Awni Y. Hannun, et al.
   - ResNet-like architecture with shortcuts for improved information propagation.
   - Scaled down to approximately 1/5th the size of the reference model due to computing constraints.

3. **Implementation Details**:
   - Input: 30-second ECG signal, sampled at 300Hz, pre-processed to zero mean and unit variance.
   - Output: 4-dimensional probability array for each class [AF, N, O, ~].
   - Developed in Python using TensorFlow Estimator Object API.
   - Designed for compatibility with Intel Neural Compute Stick (NCS).

4. **Performance**:
   - Achieved 75% accuracy and 0.81 AUC score on the validation set (20% of the dataset).
   - Exceeded the team's success criteria of 65% accuracy.

5. **Future Improvements**:
   - Potential for dataset expansion through:
     - Combining with other certified datasets.
     - Online machine learning from deployed monitors.
     - Data augmentation techniques.
     - Possible implementation of generative and verification neural networks for synthetic data.
   - Scalable architecture allows for easy model size increase when more computing resources are available.

This implementation provides a robust foundation for AF detection, with potential for further improvements in accuracy and efficiency as the project evolves.





[More details can be found here](https://github.com/anujaagaitonde/Bedside-Monitor/wiki).
