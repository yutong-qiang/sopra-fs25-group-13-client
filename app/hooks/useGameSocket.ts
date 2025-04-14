// app/hooks/useGameSocket.ts
import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

type PlayerAction = {
  actionType: string;
  gameSessionToken: string;
};

type UseGameSocketProps = {
  gameSessionToken: string;
  authToken: string | null;
};

const useGameSocket = ({ gameSessionToken, authToken }: UseGameSocketProps) => {
  const clientRef = useRef<Client | null>(null);

  // Subscribe to topic/game/{gameSessionToken}
  type GameMessage = { 
    actionType: string; 
    payload?: Record<string, unknown>;
  };
  const subscribeToGame = (callback: (message: GameMessage) => void) => { 
    if (!clientRef.current || !clientRef.current.connected) return () => {};
    const subscription = clientRef.current.subscribe(
      `/game/topic/${gameSessionToken}`,
      (msg: IMessage) => {
        callback(JSON.parse(msg.body));
      }
    );
    return () => subscription.unsubscribe();
  };

  // Subscribe to topic/user/{authToken}
  type UserMessage = { 
    actionType: string; 
    payload?: Record<string, unknown>;
  };
  const subscribeToUser = (callback: (message: UserMessage) => void) => {
    if (!clientRef.current || !clientRef.current.connected) return () => {};
    const subscription = clientRef.current.subscribe(
      `/game/topic/user/${authToken}`,
      (msg: IMessage) => {
        callback(JSON.parse(msg.body));
      }
    );
    return () => subscription.unsubscribe();
  };

  const sendAction = (actionType: string) => {
    if (!clientRef.current || !clientRef.current.connected || !authToken) return;
    const action: PlayerAction = {
      actionType,
      gameSessionToken,
    };

    clientRef.current.publish({
      destination: "/app/game/player-action",
      headers: {
        "auth-token": authToken,
      },
      body: JSON.stringify(action),
    });
  };

  const disconnect = () => {
    clientRef.current?.deactivate();
  };

  useEffect(() => {
    if (!authToken || !gameSessionToken) return;

    const sock = new SockJS(process.env.NEXT_PUBLIC_SOCKET_URL!);
    const client = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Connected to WebSocket");
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [authToken, gameSessionToken]);

  return {
    sendAction,
    subscribeToGame,
    subscribeToUser,
    disconnect,
  };
};

export default useGameSocket;
