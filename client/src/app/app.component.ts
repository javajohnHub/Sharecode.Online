import { Component } from '@angular/core';
import {SocketService} from './shared/socket.service';
import { AuthService } from './shared/auth.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';
  socket: any;
  constructor(private _auth: AuthService) {
    this.socket = SocketService.getInstance();
  }

  ngOnInit() {
    this._auth.localAuthSetup();
  }
}
