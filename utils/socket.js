import { Socket } from 'phoenix';

let socket = null;

export function getSocket(userId, groupId, configId) {
  if (!socket) {
    socket = new Socket(process.env.NEXT_PUBLIC_SOCKET_URL, { params: { userId: userId, groupId: groupId, configId: configId } });
    socket.connect();
  }
  return socket;
}

export function getChannel(userId, groupId, configId) {
  const socket = getSocket(userId, groupId, configId);


  // Join Evi lobby channel for messaging/hand raising
  const channel = socket.channel(`evi:lobby`, { userId, groupId, configId });

  return { channel };
}