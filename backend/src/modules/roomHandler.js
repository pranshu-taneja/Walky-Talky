import { BASE_SERVER_URL, ROOM_TIMEOUT, DummySocketClient, activeRooms } from "../config.js";
import fetch from "node-fetch";


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
            `✨ ${DummySocketClient.id} dummy client has left room ${roomName}. ${Object.keys(activeRooms)?.length
            } rooms are alive NOW!!✨`
        );
    }, ROOM_TIMEOUT); //1 minute timeout
}

function DestryoRoomDeadTimer(roomName) {
    clearTimeout(activeRooms[roomName].timer);
    activeRooms[roomName].timer = null;
}

export { SetRoomDeadTimer, DestryoRoomDeadTimer, DeactivateRoom };