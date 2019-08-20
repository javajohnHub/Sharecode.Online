import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {

  constructor(public auth: AuthService) { }

  ngOnInit() {
  }

}