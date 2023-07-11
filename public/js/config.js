turnConfig = {
    iceServers: [
    {   
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
      ]
    }, 
    {   
      urls: [       
        "turn:54.210.97.239:3478?transport=udp",  
        "turn:54.210.97.239:3478?transport=tcp",       
       ],
      username: "root",   
      credential: "password"
     }
   ]
}