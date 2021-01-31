"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = require("./App");
const dotenv = require("dotenv");
dotenv.config();
const app = new App_1.App();
const { HTTP_PORT } = process.env;
app.httpServer.listen(HTTP_PORT, () => {
    console.log(`Server UP on port HTTP: ${HTTP_PORT}`);
});
