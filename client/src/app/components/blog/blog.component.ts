import { Component } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
class Post {
  author: string;
  title: string;
  body: string;
}
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
    const newPost: Post = new Post();
    newPost.author = "John";
    newPost.body = "dsrhsrthsdtfrhdsfh";
    newPost.title = "new post";
    this.socket.emit('create post', newPost);
    this.socket.emit('get all posts');
    this.socket.on('send all posts', (posts) => {
      this.posts = posts;
    })
  }

}
