import express from "express";
import { getRoom, getRoomDetails, getChat, killRoom, roomActive, createRoom, serverStatus } from "./controllers.js";


const router = express.Router();

// API Endpoints
router.get("/getroom", getRoom);
router.get("/getroomdetails", getRoomDetails);
router.get("/getchat/:roomId", getChat);
router.get("/killroom/:roomId", killRoom);
router.get("/roomactive/:roomId", roomActive);
router.get("/createroom", createRoom);
router.get("/", serverStatus);

export default router;
