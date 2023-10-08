import { MONGO_URL } from "../config.js"
import mongoose from "mongoose";

export function connectDB() {
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
