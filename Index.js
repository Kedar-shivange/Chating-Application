const http = require("http");
const express = require("express");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(path.join(__dirname, "Public")));

let onlineUsers = {}; // Object to track online users

io.on("connection", (socket) => {
  console.log("User connected...");

  // Assign a random nickname initially
  let userNickname = `User${Math.floor(Math.random() * 1000)}`;
  onlineUsers[socket.id] = userNickname;

  // Notify everyone when a user connects
  io.emit("user connected", { user: userNickname, users: onlineUsers });

  // Listen for nickname updates
  socket.on("set nickname", (nickname) => {
    onlineUsers[socket.id] = nickname;
    userNickname = nickname;
    io.emit("update users", onlineUsers);
  });

  // Listen for chat messages
  socket.on("chat message", (msg) => {
    // Broadcast to others but not back to the sender
    socket.broadcast.emit("chat message", { user: userNickname, text: msg });

    // Append message directly for the sender
    socket.emit("own message", { user: userNickname, text: msg });
  });

  // Notify others when a user is typing
  socket.on("typing", () => {
    socket.broadcast.emit("user typing", userNickname);
  });

  // Notify others when a user stops typing
  socket.on("stop typing", () => {
    socket.broadcast.emit("user stopped typing", userNickname);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`${userNickname} disconnected.`);
    delete onlineUsers[socket.id];
    io.emit("user disconnected", { user: userNickname, users: onlineUsers });
  });
});

app.get("/", (req, resp) => {
  return resp.sendFile(path.join(__dirname, "Public", "index.html"));
});

server.listen(8800, () => console.log("Server running on http://localhost:8800"));
