import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (connection, req) => {
    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenCookieString = cookies
        .split(";")
        .find((str) => str.startsWith("token="));

      if (tokenCookieString) {
        const token = tokenCookieString.split("=")[1];
        if (token) {
          jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            {},
            (err, userData) => {
              if (err) throw err;
              const { userId, username } = userData;

              // saving information
              connection.userId = userId;
              connection.username = username;
            }
          );
        }
      }
    }
    // check no of clients we are connected to
    // console.log([...wss.clients].map(c => c.username));
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  });
}
