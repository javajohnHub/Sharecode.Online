import { Component, HostListener, ViewChild, ElementRef } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: "app-ping",
  templateUrl: `./ping.component.html`
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