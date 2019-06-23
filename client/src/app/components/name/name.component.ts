import { Component, HostListener } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
import {MessageService} from 'primeng/api';
import * as Peer from "peerjs_fork_firefox40";
@Component({
  selector: "app-name",
  templateUrl: `./name.component.html`,
  providers: [MessageService]
})
export class NameComponent {
  socket: any;
  peer;
  name;
  device;
  peerId;
  nameDialogVis = true;
  constructor(private messageService: MessageService) {
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
        this.nameDialogVis = true;
        this.messageService.add({severity:'warning', summary:'Name already exists', detail:'Try ' + this.name});
      });

    });
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
    this.nameDialogVis = false;
  }

}