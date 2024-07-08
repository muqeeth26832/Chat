import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Message } from "../models/message.model.js";

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  const notifyAboutOnlinePeople = () => {
    const onlineUsers = [...wss.clients]
      .filter((client) => client.readyState === client.OPEN)
      .map((client) => ({ userId: client.userId, username: client.username }));

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ type: "online", online: onlineUsers }));
      }
    });
  };

  wss.on("connection", (connection, req) => {
    connection.isAlive = true;

    const cookies = req.headers.cookie;
    if (cookies) {
      const tokenCookieString = cookies
        .split(";")
        .find((str) => str.trim().startsWith("token="));

      if (tokenCookieString) {
        const token = tokenCookieString.split("=")[1];
        if (token) {
          jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            (err, userData) => {
              if (err) {
                connection.send(
                  JSON.stringify({ type: "error", message: "Invalid token" })
                );
                connection.terminate();
                return;
              }
              const { userId, username } = userData;
              connection.userId = userId;
              connection.username = username;
              notifyAboutOnlinePeople();
            }
          );
        } else {
          connection.send(
            JSON.stringify({ type: "error", message: "Token not found" })
          );
          connection.terminate();
        }
      } else {
        connection.send(
          JSON.stringify({ type: "error", message: "Cookies not found" })
        );
        connection.terminate();
      }
    } else {
      connection.send(
        JSON.stringify({ type: "error", message: "No cookies sent" })
      );
      connection.terminate();
    }

    connection.timer = setInterval(() => {
      if (connection.isAlive === false) {
        clearInterval(connection.timer);
        connection.terminate();
        notifyAboutOnlinePeople();
        return;
      }
      connection.isAlive = false;
      connection.ping();
    }, 5000);

    connection.on("pong", () => {
      connection.isAlive = true;
    });

    connection.on("message", async (message) => {
      try {
        const messageData = JSON.parse(message.toString());
        const { recipient, text } = messageData;

        // Validate recipient and text
        if (!mongoose.Types.ObjectId.isValid(recipient)) {
          throw new Error("Invalid recipient ID");
        }

        if (!recipient || !text) {
          throw new Error("Recipient and text are required");
        }

        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
        });

        const timestamp = new Date().toISOString();
        [...wss.clients]
          .filter((c) => c.userId === recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                type: "message",
                text,
                timestamp,
                sender: connection.userId,
                recipient,
                id: messageDoc._id,
              })
            )
          );
      } catch (error) {
        console.error("Error handling message:", error.message);
        connection.send(
          JSON.stringify({ type: "error", message: error.message })
        );
      }
    });

    connection.on("close", () => {
      clearInterval(connection.timer);
      notifyAboutOnlinePeople();
    });
  });

  wss.on("close", () => {
    console.log("WebSocket server closed");
  });
}
