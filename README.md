# WebRTC Project

## Description
WebRTC is an open-source project that provides real-time communication capabilities to web browsers and mobile applications. It allows for peer-to-peer communication, including audio, video, and data transmission, directly between web browsers without the need for plugins or additional software.

This project aims to explore the features and capabilities of WebRTC and provide a practical implementation of various real-time communication scenarios.

## Features
1. Peer-to-peer audio and video communication.
2. Video/audio toggle button.
3. Screen sharing to share your screen with other participants.
4. Recording functionality to capture audio and video streams.
5. Signaling server for establishing connections.
6. STUN and TURN servers for NAT traversal.
7. Simple and intuitive user interface.

## How to Run the Project
To run the project, follow the instructions below:
1. Make sure Node.js is installed.

2. Clone this repository by running the following command in terminal:

        $ git clone https://github.com/AkankshCaimi/WebRTC.git
        
3. Open the project directory:

        $ cd WebRTC
        
4. Run the following command on terminal to install the dependencies:

        $ npm install
        $ npm install express socket.io --save

5. Then, start the development server:

        $ node index.js

6. Open your web browser (preferably `Google Chrome`) and navigate to http://localhost:8000 .
7. Give camera and mic permission.
8. Enter a Room Name say `abc`.
9. Open another tab in the web browser and navigate to http://localhost:8000 and enter the same Room Name (here `abc`).
10. That's it! Your peer-to-peer connection is established.

## Author
Me :)

