import Room from "../models/RoomsModel.js";
import { activeRooms } from "../config.js";
import { SetRoomDeadTimer, DestryoRoomDeadTimer } from "./roomHandler.js";


export function socketEventHandler(io) {
    //------------------- Socket Events and connecting the client -------------------
    // Whole system depends on dummy client :
    // --if no client present in the room --Dummy will connect as room has to be created first (At that time of creation the Dummy will instantly connect)
    //  --There will always be a dummy client connected with the room --No Socket room will be alive for more then 1 minutes (if no client joins)-- (either when the room is created or someone's leaving room or disconnecting from the complete node server)
    //  -- If someone tries to join when the timer is ongoing means that the client is 1 ( and dummy connected only) --Then the timer will be destroyed automatically
    //  -- If someone leaves or disconnet the room and there are all teh clients disconneted from the room.. The dummy client will handle the keeping it alive for 1 minute then destroying it automatically
    io.on("connection", (socket) => {
        console.log(`✨ A Client ${socket.id} Connected to the Node server ✨`);

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
    });
    //------------------- Socket Events and connecting the client -------------------
}