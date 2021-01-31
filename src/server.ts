import { App } from './App';
import * as dotenv from 'dotenv';
dotenv.config();

const app = new App();

const { HTTP_PORT } = process.env;

app.httpServer.listen(HTTP_PORT, () => {
  console.log(`Server UP on port HTTP: ${HTTP_PORT}`);
});
