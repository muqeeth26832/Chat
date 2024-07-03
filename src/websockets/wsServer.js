import { WebSocketServer } from "ws";

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (connection,req) => {

    console.log(req);

  });

  return wss;
}
