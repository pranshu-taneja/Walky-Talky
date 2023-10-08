import { v4 as uuidv4 } from "uuid"
import Room from "../models/RoomsModel.js";
import { DummyJoinRoom } from "./dummyClientHandler.js";

const getRoom = async (req, res) => {
    const data = await Room.find();
    res.send(data);
};

const getRoomDetails = async (req, res) => {
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
};

const getChat = async (req, res) => {
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
};

const killRoom = async (req, res) => {
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
};

const roomActive = async (req, res) => {
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
};

const createRoom = async (req, res) => {
    const UNQ_Room_Name = uuidv4(); //creating a room name as a unique id

    const CreateRoom = new Room({
        roomId: UNQ_Room_Name,
        msg: [],
        status: "active",
    });

    const data = await CreateRoom.save();
    res.send(data);
    DummyJoinRoom(UNQ_Room_Name);
};

const serverStatus = (req, res) => {
    res.send("<h1>Server is working Fine!!🚀</h1>");
};


export { getRoom, getRoomDetails, getChat, killRoom, roomActive, createRoom, serverStatus }