// hooks/useSocket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const useSocket = (roomId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      query: { roomId }
    });
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId]);

  return socket;
};

export default useSocket;
