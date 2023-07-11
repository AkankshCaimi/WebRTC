'use strict';

//Defining some global utility variables
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
console.log("Welcome")
var mediaRecorder;
var recordedChunks = [];
var isRecording = false;

//Initialize turn/stun server here

var turnConfig = {
  iceServers: [
  {   
      urls: 'stun:stun.l.google.com:19302',
  }, 
  {   
    urls:'turn:54.210.97.239:3478?transport=udp',  
    username: "root",   
    credential: "password"
   },
   {   
    urls: 'turn:54.210.97.239:3478?transport=tcp',
    username: "root",   
    credential: "password"
   }
 ]
}

//turnconfig will be defined in public/js/config.js
var pcConfig = turnConfig;

//Set local stream constraints
var localStreamConstraints = {
    audio: true,
    video: true
};


// Prompting for room name:
var room = prompt('Enter room name:');

//Initializing socket.io
var socket = io.connect();

//Ask servelr to add in the room if room name is provided by the user
if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room: ', room);
}

//Defining socket events

//Event - Client has created the room i.e. is the first member of the room
socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

//Event - Room is full
socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

//Event - Another client tries to join room
socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

//Event - Client has joined the room
socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
  startRecording();
});

var recorder;

function startRecording() {
  if (!recorder) {
    console.log('MediaRecorder is not initialized.');
    return;
  }
  recorder.start();
  console.log('Recording started.');
}

function stopRecording() {
  if (!recorder) {
    console.log('MediaRecorder is not initialized.');
    return;
  }
  recorder.stop();
  console.log('Recording stopped.');
  saveRecording();
}

function saveRecording() {
  if (!recorder) {
    console.log('MediaRecorder is not initialized.');
    return;
  }
  recorder.ondataavailable = function(event) {
    if (event.data.size > 0) {
      var blob = new Blob([event.data], { type: 'video/webm' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = url;
      a.download = 'recording.webm';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };
}

var startRecordingBtn = document.getElementById('startRecordingBtn');
var stopRecordingBtn = document.getElementById('stopRecordingBtn');

startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);


//Event - server asks to log a message
socket.on('log', function(array) {
  console.log.apply(console, array);
});


//Event - for sending meta for establishing a direct connection using WebRTC
//The Driver code
socket.on('message', function(message, room) {
    console.log('Client received message:', message,  room);
    if (message === 'got user media') {
      maybeStart();
    } else if (message.type === 'offer') {
      if (!isInitiator && !isStarted) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    } else if (message.type === 'answer' && isStarted) {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStarted) {
      handleRemoteHangup();
    }
});

//Function to send message in a room
function sendMessage(message, room) {
  console.log('Client sending message: ', message, room);
  socket.emit('message', message, room);
}

//Displaying Local Stream and Remote Stream on webpage
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
var remoteScreenStream;
var remoteScreenVideo = document.querySelector('#remoteScreen');
console.log("Going to find Local media");
navigator.mediaDevices.getUserMedia(localStreamConstraints)
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});


//If found local stream
function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  recorder = new MediaRecorder(localStream);
  localVideo.srcObject = stream;
  sendMessage('got user media', room);
  if (isInitiator) {
    maybeStart();
  }
}


console.log('Getting user media with constraints', localStreamConstraints);

//If initiator, create the peer connection
function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (isStarted == false) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  } else {
      console.log("Not starting");
  }
}

//Sending bye if user closes the window
window.onbeforeunload = function() {
  sendMessage('bye', room);
};


//Creating peer connection
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

//Function to handle Ice candidates generated by the browser
function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }, room);
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

//Function to create offer
function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

//Function to create answer for the received offer
function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

//Function to set description of local media
function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription, room);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}


//Function to play remote stream as soon as this client receives it
function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  if (event.stream.id === 'screenVideo') {
    // Play the screen stream in the remote screen element
    remoteScreenStream = event.stream;
    remoteScreenVideo.srcObject = remoteScreenStream;
    remoteScreenVideo.setAttribute('playsinline', true);
  } else {
    // Play the video stream in the remote video element
    remoteVideo.srcObject = event.stream;
  }
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
  if (event.stream === remoteScreenStream) {
    // Clear the remote screen stream
    remoteScreenStream = null;
  }
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye', room);
  
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
  remoteScreenStream = null; // Clear the remote screen stream
}

var toggleVideoBtn = document.getElementById('toggleVideoBtn');
var toggleAudioBtn = document.getElementById('toggleAudioBtn');
var shareScreenBtn = document.getElementById('shareScreenBtn');

// Add event listeners to the buttons
toggleVideoBtn.addEventListener('click', toggleVideo);
toggleAudioBtn.addEventListener('click', toggleAudio);
shareScreenBtn.addEventListener('click', shareScreen);

// Toggle video state
function toggleVideo() {
  var videoEnabled = !localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = videoEnabled;
  toggleVideoBtn.classList.toggle('enabled', videoEnabled);
  toggleVideoBtn.classList.toggle('disabled', !videoEnabled);
}

// Toggle audio state
function toggleAudio() {
  var audioEnabled = !localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = audioEnabled;
  toggleAudioBtn.classList.toggle('enabled', audioEnabled);
  toggleAudioBtn.classList.toggle('disabled', !audioEnabled);
}

async function shareScreen() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia();
    const videoElement = document.getElementById('screenVideo');
    videoElement.srcObject = stream;
    localStream.addTrack(stream.getTracks()[0]);
  } catch (error) {
    console.log('Error accessing screen sharing stream: ', error);
  }
}

navigator.mediaDevices.getUserMedia(localStreamConstraints)
  .then(handleUserMedia)
  .catch(handleGetUserMediaError);

function handleGetUserMediaError(error) {
  console.log('getUserMedia error: ', error);
}