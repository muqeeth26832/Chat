import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { Message } from "../models/message.model.js";
export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (connection, req) => {
    // read user name and id from cookie
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

    connection.on("message", async (message) => {
      const messageData = JSON.parse(message.toString());
      const { recipient, text } = messageData;
      if (recipient && text) {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
        });
        const timestamp = new Date().toISOString(); // Add timestamp
        [...wss.clients]
          .filter((c) => c.userId === recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                text,
                timestamp,
                sender: connection.userId,
                recipient,
                id: messageDoc._id, // I am also sending
              })
            )
          );
      }
    });

    // check no of clients we are connected to and sent it to all users
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
