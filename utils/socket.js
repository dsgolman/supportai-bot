import { Socket } from 'phoenix';

let socket = null;

export function getSocket(userId, groupId) {
  if (!socket) {
    socket = new Socket(process.env.NEXT_PUBLIC_SOCKET_URL, { params: { userId: userId, groupId: groupId } });
    socket.connect();
  }
  return socket;
}

export function getChannel(userId, groupId) {
  const socket = getSocket(userId, groupId);

  // Join WebRTC channel
  // const webrtcChannel = socket.channel(`webrtc:${groupId}`, { userId });
  // webrtcChannel.join()
  //   .receive("ok", resp => console.log("Joined WebRTC channel", resp))
  //   .receive("error", resp => console.log("Unable to join WebRTC channel", resp));

  // WebRTC specific events
  // webrtcChannel.on("offer", payload => {
  //   console.log("Received offer", payload);
  // });
  // webrtcChannel.on("answer", payload => {
  //   console.log("Received answer", payload);
  // });
  // webrtcChannel.on("ice_candidate", payload => {
  //   console.log("Received ICE candidate", payload);
  // });

  // Join Evi lobby channel for messaging/hand raising
  const eviChannel = socket.channel(`evi:lobby`, { userId, groupId });

  eviChannel.on("user_raised_hand", payload => {
    console.log("User raised hand", payload);
    // humeChannel.push("user_message", { user_id: userId, content })
    //   .receive("ok", (resp: any) => {
    //     console.log("Message sent:", resp);
    //   })
    //   .receive("error", (err: any) => {
    //     console.error("Error sending message:", err);
    //   });
  });

  eviChannel.on("active_speaker", payload => {
    console.log("Active speaker set", payload);
  });

  return { eviChannel };
}


export function createPeerConnection(webrtcChannel) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.onicecandidate = event => {
    if (event.candidate) {
      webrtcChannel.push("ice_candidate", { candidate: event.candidate });
    }
  };

  pc.ontrack = event => {
    console.log("Received track", event.track);
  };

  return pc;
}
