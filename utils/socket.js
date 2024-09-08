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
  const channel = socket.channel("evi:lobby", {userId, groupId});

  channel.join()
    .receive("ok", resp => console.log("Joined successfully", resp))
    .receive("error", resp => console.log("Unable to join", resp));

  channel.on("bot_message", (message) => {
    try {
      console.log("Received message:", message);
    } catch (error) {
      console.error("Error serializing message:", error);
    }
  });

  channel.on('user_joined', payload => {
    console.log(`User ${payload.userId} joined`);
  });
  
  channel.on('user_raised_hand', payload => {
    console.log(`User ${payload.userId} raised their hand`);
  });
  
  channel.on('active_speaker', payload => {
    console.log(`Active speaker is ${payload.userId}`);
  });
  
  channel.on('user_left', payload => {
    console.log(`User ${payload.userId} left`);
  });

  channel.on("audio_output", (message) => {
    try {
      console.log("Received message:", message);
    } catch (error) {
      console.error("Error serializing message:", error);
    }
  });

  return channel;
}
