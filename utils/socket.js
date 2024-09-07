import { Socket } from 'phoenix';

let socket = null;

export function getSocket(userId) {
  if (!socket) {
    socket = new Socket(process.env.NEXT_PUBLIC_SOCKET_URL, { params: { userId: userId } });
    socket.connect();
  }
  return socket;
}

export function getChannel(userId) {
  const socket = getSocket(userId);
  const channel = socket.channel("evi:lobby", {});

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

  channel.on("audio_output", (message) => {
    try {
      console.log("Received message:", message);
    } catch (error) {
      console.error("Error serializing message:", error);
    }
  });

  return channel;
}
