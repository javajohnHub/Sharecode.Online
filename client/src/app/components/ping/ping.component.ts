import { Component } from '@angular/core';
import {SocketService} from '../../shared/socket.service';
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: 'app-ping',
  template: `
  <ng-container *ngFor="let message of messages">
  <span *ngIf="person" [ngStyle]="{'color': person.color}">{{person.peerId}}:</span> {{message}}
  </ng-container>

  <input (keydown.enter)="sendMessage()" pInputText type="text" class="ui-g-9" placeholder="Your message" id="msg"
                name="message" [(ngModel)]="message">

            <button pButton id="send" class="ui-g-3" type="submit" (click)="sendMessage()" [disabled]="message.length < 1 || message.length > 80"
                label="Send"></button>
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

    this.socket.on("message", message => {
      this.messages.push(message);
    });
  }

  sendMessage() {
    this.socket.emit('message', this.message);
    this.message = "";
  }
}