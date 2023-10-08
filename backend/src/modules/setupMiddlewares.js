import cors from "cors";
import router from "./apiRoutes.js";
import morgan from "morgan"

export function setupMiddlewares(app){
    app.use("/api", router);
    app.use(cors());
    app.use(morgan("dev"));
}