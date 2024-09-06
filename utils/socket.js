import { Socket } from 'phoenix';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = new Socket("ws://localhost:4000/socket", { params: { token: window.userToken } });
    socket.connect();
  }
  return socket;
}

export function getChannel() {
  const socket = getSocket();
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
