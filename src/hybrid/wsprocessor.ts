import { Server as HttpServer } from 'node:http';
import { EventEmitter } from 'node:events';
import * as net from 'node:net';
import * as WebSocket from 'ws';

let ST_STARTED = 1;
let ST_CLOSED = 2;

/**
 * websocket protocol processor
 */
export class WSProcessor extends EventEmitter {
    httpServer: HttpServer;
    wsServer: WebSocket.Server;
    state: number;

    constructor() {
        super();
        this.httpServer = new HttpServer();

        let self = this;
        this.wsServer = new WebSocket.Server({ server: this.httpServer });

        this.wsServer.on('connection', function (socket, request) {
            // emit socket to outside
            self.emit('connection', socket, request);
        });

        this.state = ST_STARTED;
    }


    add(socket: net.Socket, data: Buffer) {
        if (this.state !== ST_STARTED) {
            return;
        }
        this.httpServer.emit('connection', socket);
        if (typeof (socket as any).ondata === 'function') {
            // compatible with stream2
            (socket as any).ondata(data, 0, data.length);
        } else {
            // compatible with old stream
            socket.emit('data', data);
        }
    }

    close() {
        if (this.state !== ST_STARTED) {
            return;
        }
        this.state = ST_CLOSED;
        this.wsServer.close();
        this.wsServer = null;
        this.httpServer = null;
    }
}