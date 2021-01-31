import * as express from 'express';
import * as http from 'http';
import * as socketIo from 'socket.io';
import { NodeSSH } from 'node-ssh';

export class App {
  public app: express.Application;
  public httpServer: http.Server;
  private io: socketIo.Server;
  public HTTP_PORT: number = 5000;
  public HTTPS_PORT: number = 5443;
  public ssh = new NodeSSH();

  constructor() {
    this.use();
    this.sockets();
    this.listen();
  }

  use() {
    this.app = express();
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
      next();
    });
    this.app.use(express.json());
    this.app.use((error, req, res, next) => {
      return res.status(500).json({ error: error.toString() });
    });
  }

  private sockets(): void {
    this.httpServer = http.createServer(this.app);
    this.io = new socketIo.Server(this.httpServer, {
      cors: {
        origin: '*'
      }
    });
  }

  private listen(): void {
    const sshConfig = {
      host: '192.168.15.21',
      username: 'root',
      password: '010101',
      port: 22,
      privateKey: '/home/mrai/.ssh/id_rsa'
    };

    this.io.use((socket, next) => {
      const { token }: any = socket.handshake.auth;
      console.log(token);
      if (token === 'oi') {
        next();
      } else {
        console.log('nao autorizado');
        const err: any = new Error('not authorized');
        err.data = { content: 'Please retry later' }; // additional details
        next(err);
      }
    });

    this.io.on('connection', async (socket: any) => {
      await this.ssh.connect(sshConfig);
      const shellStream = await this.ssh.requestShell();
      socket.on('message', msg => {
        const data = JSON.parse(msg);
        switch (data.method) {
          case 'command':
            shellStream.write(data.command.trim() + '\n');
            break;
        }
      });
      // listener
      shellStream.on('data', data => {
        const d = JSON.stringify({
          jsonrpc: '2.0',
          data: data.toString()
        });
        socket.emit('message', d);
      });
      shellStream.stderr.on('data', data => {
        const d = JSON.stringify({
          jsonrpc: '1.0',
          data: data.toString()
        });
        socket.emit('message', d);
      });
    });
  }
}
