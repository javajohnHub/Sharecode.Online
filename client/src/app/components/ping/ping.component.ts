import { Component } from '@angular/core';
import {SocketService} from '../../shared/socket.service';
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: 'app-ping',
  template: `
  <input [(ngModel)]="name"/>
  <button type="button" (click)="sendName()">Send Name</button>
  `
})
export class PingComponent {
  socket: any;
  peer;
  people;
  color;
  person;
  messages = [];
  message;
  name;
  device;
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
    });

    this.socket.on("exists", proposedName => {
      this.name = proposedName.proposedName;
    });

  }
  sendName(){
    this.device = "desktop";
    if (
      navigator.userAgent.match(
        /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i
      )
    ) {
      this.device = "mobile";
    }
    this.socket.emit('send name', {name: this.name, device: this.device})
  }

}