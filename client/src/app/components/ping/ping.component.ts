import { Component, HostListener, ViewChild, ElementRef } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: "app-ping",
  template: `<ng-template #loading>Loading Peer Id...</ng-template>
  <div *ngIf="peerId; else loading">
    <h2>
      <span style="color: lightblue">
        Current name:</span> {{chosenName}} | <span style="color: lightblue">Current Room: </span>{{chosenRoom}}<br />
    </h2>
    <div *ngIf="!nameFlag">
      <input type="text" placeholder="Name" [(ngModel)]="name" />
      <button type="button" [disabled]="!name" (click)="sendName()">Send Name</button><br /><br />
    </div>
    <div *ngIf="!inRoom">
      <input type="text" placeholder="Room Name" [(ngModel)]="room" /><br />
      Limit: <input type="number" [(ngModel)]="limit" /><br/>
      <button type="button" [disabled]="!room" (click)="sendRoom()">Create room</button><br />
    </div>
    <span style="color: lightblue">People:</span> {{ peopleCount }}

    <br />
    <div *ngFor="let peep of peeps">
      <div *ngFor="let p of [peep]">
        {{p.name}}
      </div>
    </div>
    <hr/>
    <span style="color: lightblue">Rooms:</span> {{ roomCount }}

    <br />
    <ng-container *ngIf="!inRoom" >
    <div *ngFor="let rm of rms" ><button type="button" (click)="joinRoom(rm.id)">
      Join {{ rm.name }}
    </button></div>
  </ng-container>
  <ng-container *ngFor="let rm of rms" >
    <div *ngIf="person.inroom === rm.id" ><button type="button" (click)="leaveRoom(rm.id)">
      Leave {{ rm.name }}
    </button></div>
  </ng-container>

    <div id="chat-div" *ngIf="messages.length > 0" #scrollMe>
      <ul>
        <li *ngFor="let msg of messages">
          {{ msg.time }} {{ msg.from }}:
          <span [style.color]="msg.color">{{ msg.msg }}</span>
        </li>
      </ul>

    </div>
    <input [(ngModel)]="msg" />
    <button type="button" [disabled]="!msg && !nameFlag" (click)="sendMsg()">Send Msg</button><br />


    <br />

  </div>`
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
  peopleCount;
  roomCount;
  rooms;
  room;
  limit = 2;
  rms;
  peeps;
  msg;
  peerId;
  nameFlag = false;
  inRoom = false;
  chosenName;
  chosenRoom;
  @ViewChild('scrollMe', {static: false}) private myScrollContainer: ElementRef;
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
      this.peerId = this.peer.id;
      this.socket.emit("peerId", this.peer.id);

      this.socket.on("exists", proposedName => {
        this.name = proposedName.proposedName;
        alert("name exists try " + this.name);
      });

      this.socket.on("admin chat", msg => {
        this.messages.push(msg);
      });
      this.socket.on("message", msg => {
        this.messages.push(msg);

        let shouldScroll = this.myScrollContainer.nativeElement.scrollTop +
        this.myScrollContainer.nativeElement.clientHeight === this.myScrollContainer.nativeElement.scrollHeight;
        if (!shouldScroll) {
          this.scrollToBottom();
        }
      });
    });

    this.socket.on("update-people", people => {
      this.people = people.people;
      this.peopleCount = people.peopleCount;
      this.person = this.people[this.socket.socket.id];
      this.peeps = Object.values(this.people);
    });

    this.socket.on("update-rooms", rooms => {
      this.rooms = rooms.rooms;
      this.roomCount = rooms.roomCount;
      this.rms = Object.values(this.rooms);
    });
    this.scrollToBottom();
  }

  @HostListener("window:beforeunload", ["$event"])
  unloadHandler(event: Event) {
    this.socket.emit("disconnected");
  }

  sendName() {
    this.device = "desktop";
    if (
      navigator.userAgent.match(
        /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i
      )
    ) {
      this.device = "mobile";
    }
    this.socket.emit("send name", { name: this.name, device: this.device });
    this.nameFlag = true;
    this.chosenName = this.name;
  }

  sendRoom() {
    this.socket.emit("create room", { name: this.room, limit: this.limit });
    this.inRoom = true;
    this.chosenRoom = this.room;
  }

  sendMsg() {
    this.socket.emit("message", this.msg);
    this.msg = "";
  }
  removeRoom() {
    this.socket.emit("remove room");
  }

  joinRoom(id) {
    this.socket.emit("join room", id);
    this.inRoom = true;
    this.chosenRoom = this.rooms[id].name;
  }

  leaveRoom(id) {
    console.log(this.rooms[id].people, this.rooms[id].people.includes(this.socket.socket.id))
    this.socket.emit("leave room", id);
    console.log(this.rooms[id].people, this.rooms[id].people.includes(this.socket.socket.id))
    this.rms.forEach((room) => {

      if(room.people.includes(this.socket.socket.id)){
        this.inRoom = false;
        this.chosenRoom = null;
      }
    })
    this.messages = [];
  }
  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}