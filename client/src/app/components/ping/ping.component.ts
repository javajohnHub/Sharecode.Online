import { Component } from '@angular/core';
import {SocketService} from '../../shared/socket.service';
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: 'app-ping',
  template: `
   {{this.peer.id}}
  `
})
export class PingComponent {
  socket: any;
  peer;
  constructor() {
    this.socket = SocketService.getInstance();

    this.peer = new Peer({
      host: "sharecode.online",
      port: "9000",
      path: "/",
      secure: true,
      debug: 3
    });
    this.peer.on("open", () => {
      console.log(this.peer.id);
    });
  }
}