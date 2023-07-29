import express from "express";
// import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import mongoose from "mongoose";
import Room from "./models/Rooms.js";
import fetch from "node-fetch";
import { io as io_client } from "socket.io-client";

//------------------- Dummy Client Configurations -------------------
let DummySocketClient = null;
//------------------- Dummy Client Configurations -------------------

//------------------- all the variables or containers -------------------
const ROOM_TIMEOUT = 100000; //1 minutes
const activeRooms = {}; //for managing rooms as the inbuilt method gives more then just rooms (i.e: including the clients connections as socket rooms itself also)
//------------------- all the variables or containers -------------------

//------------------- Intializing the instance of imported packages & using middlewares -------------------
const app = express();
config();

// app.use(morgan("dev"));
app.use(cors());
const server = http.createServer(app);
const port = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
const BASE_SERVER_URL = process.env.BASE_URL;
const io = new Server(server, {
  cors: {
    origins: "*:*",
    methods: ["GET", "POST"],
  },
  allowEIO3: true,
});
//------------------- Intializing the instance of imported packages & using middlewares -------------------

//------------------- Socket Events and connecting the client -------------------
// Whole system depends on dummy client :
// --if no client present in the room --Dummy will connect as room has to be created first (At that time of creation the Dummy will instantly connect)
//  --There will always be a dummy client connected with the room --No Socket room will be alive for more then 1 minutes (if no client joins)-- (either when the room is created or someone's leaving room or disconnecting from the complete node server)
//  -- If someone tries to join when the timer is ongoing means that the client is 1 ( and dummy connected only) --Then the timer will be destroyed automatically
//  -- If someone leaves or disconnet the room and there are all teh clients disconneted from the room.. The dummy client will handle the keeping it alive for 1 minute then destroying it automatically
io.on("connection", (socket) => {
  console.log(`✨ A Client ${socket.id} Connected to the Node server ✨`);

  socket.on("chatMessage", async (data) => {
    try {
      const { room, message, timestamp } = data;
      socket.to(room).emit("getChat", { message });
      const roomData = await Room.findOne({ roomId: room });
      roomData.msg.push({
        sender: socket.id,
        content: message,
        timestamp: timestamp,
      });
      await roomData.save();
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    socket.room = roomName;

    if (!activeRooms[roomName]) {
      //---if room not exists-- i.e: Dummy is trying to join a newly created room
      //Here we may need to validate from DB      (NOTE To remember)
      activeRooms[roomName] = {
        clients: new Set(),
        timer: null,
      };
      console.log(
        `✨ ${activeRooms[roomName].clients.size} clients Currently in room ${roomName}!! Connecting ---DUMMY Client--- ✨`
      );
    } else if (activeRooms[roomName].clients.size === 1) {
      //if timer is ongoing (clients == 1 --dummy one--)
      DestryoRoomDeadTimer(roomName);
      console.log(
        `✨ Someone's trying to connect!!---- Destroying timer and keeping the room alive.------`
      ); //destroy timer starts
    } else {
      //if timer is null (clients > 1)
      console.log(
        `✨ ${activeRooms[roomName].clients.size} clients are connected to room ${roomName} NOW!! ---should be one+ then expected due to dummy client---✨`
      );
    }
    activeRooms[roomName].clients.add(socket.id);
    console.log(`✨ ${socket.id} joined room ${roomName} ✨`);
  });

  socket.on("leaveRoom", async (roomName) => {
    await socket.leave(roomName);
    activeRooms[roomName]?.clients.delete(socket.id);
    console.log(`✨ ${socket.id} client has left room ${roomName} ✨`);

    if (activeRooms[roomName]?.clients.size === 1) {
      SetRoomDeadTimer(roomName);
    }
  });

  socket.on("disconnect", () => {
    console.log(
      `✨ ${socket.id} client from ${socket.room} room disconnected ✨`
    );
    const roomName = socket.room;
    activeRooms[roomName]?.clients.delete(socket.id);

    if (activeRooms[roomName]?.clients.size === 1) {
      SetRoomDeadTimer(roomName);
    }
  });
});
//------------------- Socket Events and connecting the client -------------------

//------------------- API Endpoints -------------------
app.get("/api/getroom", async (req, res) => {
  const data = await Room.find();
  res.send(data);
});

app.get("/api/getroomdetails", async (req, res) => {
  //get list of rooms (Note: including the client individual connection also) from this Endpoint (--using inbuilt Method inside--)
  //Getting the adapter data from inbuilt rooms method
  const data = io.of("/").adapter.rooms;
  // Convert the Map to a plain JavaScript object
  const AdapterData = {};
  data.forEach((value, key) => {
    AdapterData[key] = Array.from(value);
  });

  //Getting the active rooms data
  const ActiveRooms = activeRooms;

  res.json({ "AdapterData:": AdapterData });
  // res.json({"AdapterData:":AdapterData, "ActiveRoomsData:":ActiveRooms});
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
  const UNQ_Room_Name = uuidv4(); //creating a room name as a unique id

  const CreateRoom = new Room({
    roomId: UNQ_Room_Name,
    msg: [],
    status: "active",
  });

  const data = await CreateRoom.save();
  res.send(data);
  DummyJoinRoom(UNQ_Room_Name);
});

app.get("/api", (req, res) => {
  res.send("<h1>Server is working Fine!!🚀</h1>");
});
//------------------- API Endpoints -------------------

async function DummyJoinRoom(roomName) {
  //will work when createRoom button is clicked
  await DummySocketClient?.emit("joinRoom", roomName);
  setTimeout(() => {
    SetRoomDeadTimer(roomName);
  }, 1000);
}

async function DeactivateRoom(roomName) {
  //when the timer will be passed and dummy client is handling its setting of inactive status on DB
  const res = await fetch(`${BASE_SERVER_URL}/api/killroom/${roomName}`);
  const msg = await res.json();
  console.log(`message from the DB: ${msg.message} for room ${roomName} ✨`);
}

function SetRoomDeadTimer(roomName) {
  console.log(`✨ Setting a Deadly Timer for Room --> ${roomName} ✨`);
  activeRooms[roomName].timer = setTimeout(() => {
    DummySocketClient.emit("leaveRoom", roomName);
    DeactivateRoom(roomName);
    delete activeRooms[roomName];
    console.log(
      `✨ ${DummySocketClient.id} dummy client has left room ${roomName}. ${
        Object.keys(activeRooms)?.length
      } rooms are alive NOW!!✨`
    );
  }, ROOM_TIMEOUT); //1 minute timeout
}

function DestryoRoomDeadTimer(roomName) {
  clearTimeout(activeRooms[roomName].timer);
  activeRooms[roomName].timer = null;
}

//------------------- CreateDummyClient on server intiating -------------------
function CreateDummyClient() {
  //will work when server intiates
  DummySocketClient = io_client(BASE_SERVER_URL); // Replace with your server URL
  DummySocketClient.on("connect", () => {
    console.log(
      `✨ Dummy Client --> ${DummySocketClient.id} <-- is Connected to the server ✨`
    );
  });
}
//------------------- CreateDummyClient on server intiating -------------------

//------------------- Connect DB function -------------------
function connectDB() {
  try {
    mongoose
      .connect(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("✨ Connected to Mongodb ✨");
      });
  } catch (err) {
    console.error(err);
    setTimeout(connectDB, 1000); // Retry connection after delay
  }
}
//------------------- Connect DB function -------------------

//------------------- Starting the Server -------------------
function startServer() {
  try {
    connectDB();
    CreateDummyClient();
    server.listen(port, () => {
      console.log(`✨ Server listening on port ${port} ✨`);
    });
  } catch (err) {
    console.error(err);
  }
}
//------------------- Starting the Server -------------------

startServer();

//------------------- Analyzing and logging (FOR Debugging )  (Use it before function startserver) -------------------
// function XtraLog() {
//   console.log("AdapterRooms:", io.of("/").adapter.rooms);
//   console.log("activeRooms:", activeRooms);      //will show you complete activeRooms objects (with timeout objects as well)
// }

// setInterval(() => {
//   XtraLog();
// }, 3000);
//------------------- Analyzing and logging (FOR Debugging ) -------------------
