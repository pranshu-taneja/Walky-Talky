import { createSocketServer } from "./modules/getServer.js";
import { createExpressAppInstance, createHttpServer } from "./modules/getServer.js";
import { socketEventHandler } from "./modules/socketEventHandler.js";
import { port } from "./config.js"
import { connectDB } from "./modules/dbConnection.js";
import { CreateDummyClient } from "./modules/dummyClientHandler.js";
import { setupMiddlewares } from "./modules/setupMiddlewares.js";


// //------------------- custom -------------------

// //------------------- custom -------------------

async function startServer() {
    try {
        connectDB();                    //why do i have to call there inside too
        const app = createExpressAppInstance();
        
        setupMiddlewares(app);
        const httpServer = createHttpServer(app, port);
        const ioServer = createSocketServer(httpServer);
        CreateDummyClient();
        socketEventHandler(ioServer);
    } catch (error) {
        console.error("Error during server startup:", error);        
    }
}

startServer();