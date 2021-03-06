import { Component } from "@angular/core";
import { SocketService } from "../../shared/socket.service";

@Component({
  selector: "app-blog",
  templateUrl: "blog.component.html"
})
export class BlogComponent {
  socket: any;
  posts;
  constructor() {
    this.socket = SocketService.getInstance();
  }

  ngOnInit(){
    this.socket.emit('get all posts');
    this.socket.on('send all posts', (posts) => {
      this.posts = posts;
    })
  }

  delete(id){
    this.socket.emit('delete post', id)
  }

}
