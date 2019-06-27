import { Component, HostListener, ViewChild, ElementRef } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
import { FormGroup, FormBuilder } from '@angular/forms';
import { ConfirmationService } from "primeng/api";
@Component({
  selector: "app-ping",
  templateUrl: `./ping.component.html`,
  providers: [ConfirmationService]
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
  limit;
  rms;
  peeps;
  msg;
  peerId;
  nameFlag = false;
  inRoom = false;
  chosenName;
  chosenRoom;
  whisperBoxVis = false;
  whispers = [];
  whisper;
  toName;
  chosenDm;
  newMsgs = false;
  peepDisplay = false;
  roomDisplay = false;
  from;
  red;
  blue;
  green;
  settingsVis = false;
  msgForm: FormGroup;
  emojis;
  hov = false;
  stream;
  remotestream;
  inCall = false;
  addRoomVis;
  @ViewChild("localVideo", { static: false })
  localVideo: any;
  @ViewChild("theirVideo", { static: false })
  theirVideo: any;
  callRejectedVis = false;
  @ViewChild("scrollMe", { static: false })
  private myScrollContainer: ElementRef;
  @ViewChild("scrollMe2", { static: false })
  private myScrollContainer2: ElementRef;
  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService
  ) {
    this.socket = SocketService.getInstance();
    this.socket.on("admin chat", msg => {
      this.messages.push(msg);
    });
    this.socket.on("message", msg => {
      this.messages.push(msg);

      let shouldScroll =
        this.myScrollContainer.nativeElement.scrollTop +
          this.myScrollContainer.nativeElement.clientHeight ===
        this.myScrollContainer.nativeElement.scrollHeight;
      if (!shouldScroll) {
        this.scrollToBottom();
      }
    });

    this.socket.on("join succeeded", id => {
      this.inRoom = true;
      this.chosenRoom = this.rooms[id].name;
    });
    this.socket.on("join failed", () => {
      this.inRoom = false;
      this.chosenRoom = null;
    });
    this.socket.on("whisper", msg => {
      this.whispers.push(msg);
      this.scrollToBottom();
    });

    this.socket.on("open dialog", msg => {
      this.newMsgs = true;
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
    this.createForm();

    this.msgForm.valueChanges.subscribe(val => {
      if (val.msg && val.msg.includes(":")) {
        this.socket.emit("get emojis", val.msg);
      }
    });

    this.socket.on("recieve emojis", emojis => {
      this.emojis = emojis;
    });

    this.socket.on("call rejected", data => {
      this.callRejectedVis = true;
    });

    this.socket.on("request", data => {
      console.log("request", data);
      this.confirm(data);
    });
  }

  createForm() {
    this.msgForm = this.fb.group({
      msg: [""]
    });
  }
  @HostListener("window:beforeunload", ["$event"])
  unloadHandler(event: Event) {
    this.socket.emit("disconnected");
  }

  chosenNameFn(event) {
    this.chosenName = event.name;
  }
  urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
      return '<a href="' + url + '" target="_blank">' + url + "</a>";
    });
  }
  whisperBox(p) {
    this.toName = p.name;
    this.chosenDm = p;
    this.whisperBoxVis = true;
  }
  sendWhisper() {
    this.socket.emit("whisper", {
      msg: this.whisper,
      to: this.chosenDm.id,
      from: this.person.id
    });
    this.whisper = "";
    this.newMsgs = false;
  }
  sendRoom() {
    this.socket.emit("create room", { name: this.room, limit: this.limit });
    this.inRoom = true;
    this.chosenRoom = this.room;
  }

  sendMsg() {
    this.socket.emit("message", { msg: this.msg, id: null });
    this.msg = "";
    this.emojis = [];
  }

  removeRoom() {
    this.socket.emit("remove room");
  }

  joinRoom(id) {
    this.socket.emit("join room", id);
  }

  leaveRoom(id) {
    console.log(
      this.rooms[id].people,
      this.rooms[id].people.includes(this.socket.socket.id)
    );
    this.socket.emit("leave room", id);
    console.log(
      this.rooms[id].people,
      this.rooms[id].people.includes(this.socket.socket.id)
    );
    this.rms.forEach(room => {
      if (room.people.includes(this.socket.socket.id)) {
        this.inRoom = false;
        this.chosenRoom = null;
      }
    });
    this.messages = [];
  }

  hide() {
    this.peepDisplay = false;
  }

  show() {
    this.newMsgs = false;
  }

  settings() {
    this.settingsVis = true;
  }
  changeColor() {
    this.socket.emit("change color", {
      red: this.red,
      blue: this.blue,
      green: this.green
    });
  }
  peerObj(peer) {
    this.peer = peer;
    var n = <any>navigator;
    n.getUserMedia =
      n.getUserMedia ||
      n.webkitGetUserMedia ||
      n.mozGetUserMedia ||
      n.msGetUserMedia;
    this.peer.on("call", call => {
      console.log(call)
      n.getUserMedia(
        { video: true, audio: true },
        stream => {
          this.stream = stream;
          call.answer(stream);
          call.on("stream", remotestream => {
            this.remotestream = remotestream;
            this.theirVideo.nativeElement.srcObject = remotestream

            this.theirVideo.nativeElement.play();
            this.localVideo.nativeElement.srcObject = stream;
            this.localVideo.nativeElement.play();

          });
        },
        function(err) {
          this.call = false;
          console.log("Failed to get stream", err);
        }
      );
    });
  }
  call(from) {
    this.socket.emit("call_request", from);
  }

  endCall(){
    if (this.inCall && this.stream && this.remotestream) {
      let tracks = this.stream.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      let remoteTracks = this.remotestream.getTracks();
      remoteTracks.forEach(track => {
        track.stop();
      });
    }
  }
  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      this.myScrollContainer2.nativeElement.scrollTop = this.myScrollContainer2.nativeElement.scrollHeight;
    } catch (err) {}
  }

  confirm(data) {
    console.log(data);
    this.confirmationService.confirm({
      message: "Would you like to accept a call from " + data.person + "?",
      accept: () => {
        this.videoconnect(data);
      },
      reject: () => {
        this.videoReject(data);
      }
    });
  }

  videoReject(data) {
    this.socket.emit("call rejected", data);
  }

  videoconnect(data) {
    var n = <any>navigator;

    n.getUserMedia =
      n.getUserMedia ||
      n.webkitGetUserMedia ||
      n.mozGetUserMedia ||
      n.msGetUserMedia;

    n.getUserMedia(
      { video: true, audio: true },
      stream => {
        var call = this.peer.call(data.caller.peer, stream);
        call.on("stream", remotestream => {
          this.inCall = true;
          this.theirVideo.nativeElement.srcObject = remotestream;
          this.theirVideo.nativeElement.play();
          this.localVideo.nativeElement.srcObject = stream
          this.localVideo.nativeElement.play();
        });
      },
      err => {
        console.log("Failed to get stream", err);
      }
    );
  }
}