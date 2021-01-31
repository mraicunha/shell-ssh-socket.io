"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const node_ssh_1 = require("node-ssh");
class App {
    constructor() {
        this.HTTP_PORT = 5000;
        this.HTTPS_PORT = 5443;
        this.ssh = new node_ssh_1.NodeSSH();
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
    sockets() {
        this.httpServer = http.createServer(this.app);
        this.io = new socketIo.Server(this.httpServer, {
            cors: {
                origin: '*'
            }
        });
    }
    listen() {
        const sshConfig = {
            host: '192.168.15.21',
            username: 'root',
            password: '010101',
            port: 22,
            privateKey: '/home/mrai/.ssh/id_rsa'
        };
        this.io.use((socket, next) => {
            const { token } = socket.handshake.auth;
            console.log(token);
            if (token === 'oi') {
                next();
            }
            else {
                console.log('nao autorizado');
                const err = new Error('not authorized');
                err.data = { content: 'Please retry later' };
                next(err);
            }
        });
        this.io.on('connection', (socket) => __awaiter(this, void 0, void 0, function* () {
            yield this.ssh.connect(sshConfig);
            const shellStream = yield this.ssh.requestShell();
            socket.on('message', msg => {
                const data = JSON.parse(msg);
                switch (data.method) {
                    case 'command':
                        shellStream.write(data.command.trim() + '\n');
                        break;
                }
            });
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
        }));
    }
}
exports.App = App;
