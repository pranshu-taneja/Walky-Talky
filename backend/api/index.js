import express from "express";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import mongoose from "mongoose";
import Room from "../models/Rooms.js";

//used for __dirname as in commmon js modules
// import * as url from 'url';
// import path from 'path';
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

//------------------- all the variables or containers -------------------
const ROOM_TIMEOUT = 10000;
const activeRooms = {
};

const newRoom = new Room({
  roomId: uuidv4(),
  msg: [],
  status: "active",
});
//------------------- all the variables or containers -------------------

//------------------- Intializing the instance of imports -------------------
const app = express();
config();



// // adding frontend build
// app.use(express.static(path.join(path.dirname(__dirname), 'build')));


app.use(morgan("dev"));
app.use(cors());
const server = http.createServer(app);
const port = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
const io = new Server(server, {
  cors: {
    origins:'*:*',
    methods: ["GET", "POST"],
  },
});
//------------------- Intializing the instance of imports -------------------

//------------------- Socket Events and connecting the client -------------------
io.on("connection", (socket) => {
  console.log("A Client Connected", socket.id);

  socket.on("chatMessage", async (data) => {
    try {
      const { room, message } = data;
      const roomData = await Room.findOne({ roomId: room });
      roomData.msg.push({ sender: socket.id, content: message });
      await roomData.save();
      socket.to(room).emit("getChat", { message });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    socket.room = roomName;

    if (!activeRooms[roomName]) {
      activeRooms[roomName] = {
        clients: new Set(),
      };
    }
    activeRooms[roomName].clients.add(socket.id);
  });

  socket.on("leaveRoom", (roomName) => {
    const roomData = activeRooms[roomName];
    if (roomData) {
      roomData.clients.delete(socket.id);
      if (roomData.clients.size === 0) {
        setTimeout(async () => {
          socket.leave(roomName);
          console.log(`${socket.id} left room ${socket.room}`);
          if (roomData.clients.size === 0) {
            delete activeRooms[roomName];
            DeactivateRoom(roomName);
          }
        }, ROOM_TIMEOUT);
      } else {
        socket.leave(roomName);
        console.log(`${socket.id} left room ${socket.room}`);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(socket.id, "from", socket.room, "client disconnected");
    const roomName = socket.room;
    activeRooms[roomName]?.clients?.delete(socket.id);
    if (activeRooms[roomName]?.clients?.size === 0) {
      delete activeRooms[roomName];
      DeactivateRoom(roomName);
    }
  });
});
//------------------- Socket Events and connecting the client -------------------


async function DeactivateRoom(roomName) {
  const res = await fetch(`https://${process.env.VERCEL_URL}/api/killroom/${roomName}`);
  const msg = await res.json();
  console.log(msg);
}

//------------------- API Endpoints -------------------
app.get("/api/getroom", async (req, res) => {
  const data = await Room.find();
  res.send(data);
});

app.get("/api/getchat/:roomId", async (req, res) => {
  const room = req.params.roomId;
  const timestamp = req.query.timestamp;
  const roomData = await Room.findOne({ roomId: room });

  if (!timestamp) {
    res.send(roomData.msg);
  } else {
    const messagesBeforeTimestamp = roomData.msg.filter(
      (message) => new Date(message.timestamp) < new Date(timestamp)
    );
    res.send(messagesBeforeTimestamp.reverse());
  }
});

app.get("/api/killroom/:roomId", async (req, res) => {
  const roomId = req.params.roomId;

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    room.status = "inactive";
    await room.save();
    return res.json({ message: "Room status updated to 'inactive'" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while updating the room status" });
  }
});

app.get("/api/roomactive/:roomId", async (req, res) => {
  const roomId = req.params.roomId;

  try {
    // Find the room by roomId
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if the room status is "active"
    const isActive = room.status === "active";

    return res.json({ isActive });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while checking the room status" });
  }
});

app.get("/api/createroom", async (req, res) => {
  const CreateRoom = new Room({
    roomId: uuidv4(),
    msg: [],
    status: "active",
  });

  const data = await CreateRoom.save();
  res.send(data);
});

app.get('/api', (req, res) => {
  res.send("<h1>Server is working Fine!!🚀</h1>");
});

//------------------- API Endpoints -------------------

// Render index.html for all other requests
// app.get('*', (req, res) => {
//   // console.log(__dirname);
//   // console.log(path.dirname(__dirname));
//   // console.log(typeof(__dirname))
//   res.sendFile(path.join(path.dirname(__dirname), 'build', 'index.html'));
// });

//------------------- Analyzing and debugging  -------------------
function funRun() {
  const room = io.sockets.adapter.rooms;
  console.log(room);
  console.log(activeRooms);
}
// setInterval(() => {
//   funRun();
// }, 3000);
//------------------- Analyzing and debugging  -------------------


function connectDB(){
  try{
    mongoose.connect(MONGO_URL,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(() => {
      console.log("Connected to Mongodb");
    });
  }
  catch(err){
    console.error(err);
    setTimeout(connectDB, 1000); // Retry connection after delay
  }
}
//------------------- Starting the Server -------------------
function startServer(){
  try{
    connectDB();
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }  
  catch(err){
    console.error(err);
  }
}
//------------------- Starting the Server -------------------

startServer();