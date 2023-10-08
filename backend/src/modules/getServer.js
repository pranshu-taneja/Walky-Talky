import express from "express";
import { Server } from "socket.io";
import http from "http";

export const createExpressAppInstance = () => {
  const app = express();
  return app;
};

export const createHttpServer = (app, port) => {
  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  return httpServer;
};


export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origins: "*:*",
      methods: ["GET", "POST"],
    },
    allowEIO3: true,
  });

  return io;
};
