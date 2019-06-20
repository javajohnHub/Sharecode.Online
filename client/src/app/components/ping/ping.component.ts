import { Component, HostListener, ViewChild, ElementRef } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: "app-ping",
  template: `
    <ng-template #loading>Loading Peer Id...</ng-template>
    <div *ngIf="peerId; else loading">
      <input [(ngModel)]="name" />
      <button type="button" [disabled]="!name" (click)="sendName()">Send Name</button><br /><br />
      <input type="text" [(ngModel)]="room" /><br/>
      <input type="number" [(ngModel)]="limit" />
      <button type="button" [disabled]="!room" (click)="sendRoom()">Create room</button><br />
      <div id="chat-div" *ngIf="messages.length > 0" #scrollMe>
      <ul>
        <li *ngFor="let msg of messages">
          <span [style.color]="msg.color"
            >{{ msg.time }} {{ msg.from }}:</span
          >
          {{ msg.msg }}
        </li>
      </ul>
    </div>
      People: {{ peopleCount }}

      <br />

      Rooms: {{ roomCount }}

      <br />
      <div *ngFor="let room of rms">
        <button type="button" (click)="joinRoom(room.id)">
          Join {{ room.name }}
        </button>
        <button type="button" (click)="leaveRoom(room.id)">
          leave {{ room.name }}
        </button>
      </div>
      <!--<button type="button" (click)="removeRoom()">Remove room</button>-->
      <br />
      <input [(ngModel)]="msg" />
      <button type="button" [disabled]="!msg && !nameFlag" (click)="sendMsg()">Send Msg</button><br />
      <pre><code>{{people | json}}</code></pre>
      <pre><code>{{rooms | json}}</code></pre>
    </div>
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
  }

  sendRoom() {
    this.socket.emit("create room", { name: this.room, limit: this.limit });
  }

  sendMsg() {
    this.socket.emit("message", this.msg);
  }
  removeRoom() {
    this.socket.emit("remove room");
  }

  joinRoom(id) {
    this.socket.emit("join room", id);
  }

  leaveRoom(id) {
    this.socket.emit("leave room", id);
  }
  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}