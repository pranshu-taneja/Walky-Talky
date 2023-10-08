import { config } from "dotenv";
config();

let port = process.env.PORT;
let MONGO_URL = process.env.MONGO_URL;
let BASE_SERVER_URL = process.env.BASE_URL;
let ROOM_TIMEOUT = process.env.ROOM_TIMEOUT;
let DummySocketClient = null;
let activeRooms = {};

// console.log(port, MONGO_URL, BASE_SERVER_URL, ROOM_TIMEOUT, DummySocketClient, activeRooms)

export { port, MONGO_URL, BASE_SERVER_URL, ROOM_TIMEOUT, DummySocketClient, activeRooms };