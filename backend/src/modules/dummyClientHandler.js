import { io as io_client } from "socket.io-client";
import { DummySocketClient, BASE_SERVER_URL } from "../config.js";
import { SetRoomDeadTimer } from "./roomHandler.js";

export async function DummyJoinRoom(roomName) {
    //will work when createRoom button is clicked
    await DummySocketClient?.emit("joinRoom", roomName);
    setTimeout(() => {
        SetRoomDeadTimer(roomName);
    }, 1000);
}



export function CreateDummyClient() {
    let DummyClient = io_client(BASE_SERVER_URL); 
    DummyClient.on("connect", () => {
        console.log(
            `✨ Dummy Client --> ${DummyClient.id} <-- is Connected to the server ✨`
        );
    });

    DummySocketClient = DummyClient;        //intializing it to the global variable of config.js
}

