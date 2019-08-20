import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {

  constructor(public auth: AuthService) { }

  ngOnInit() {
  }

}