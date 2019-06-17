import { Component } from '@angular/core';
import {SocketService} from '../../shared/socket.service';
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: 'app-ping',
  template: `
   {{person.color}} {{people | json}}
  `
})
export class PingComponent {
  socket: any;
  peer;
  people;
  color;
  person;
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
      this.socket.emit('peerId', this.peer.id);
    });
    this.socket.on('update-people', (people) => {
      this.people = people;
      this.person = people[this.socket.socket.id];
    })
  }
}