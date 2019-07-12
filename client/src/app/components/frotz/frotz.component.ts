import { Component } from '@angular/core';
import {SocketService} from '../../shared/socket.service';
import {SelectItem} from 'primeng/api';
@Component({
  selector: 'app-frotz',
  template: `
    <p-dropdown [options]="games" [(ngModel)]="chosen_game" (onChange)="game_chosen()"></p-dropdown>
    <button pButton type="button" label="Clear"(click)="clear()"></button>
    <div *ngIf="game_data" [innerHTML]="game_data"></div><br/>
    <input type="text" pInputText [(ngModel)]="command"/><button pButton type="button" label="Send"(click)="send()"></button>
  `
})
export class FrotzComponent {
  socket: any;
  games: SelectItem[] = [];
  chosen_game: string;
  game_data = '';
  command: string;
  constructor() {
    this.socket = SocketService.getInstance();
    this.socket.emit('get games');
  }

  ngOnInit(){
    this.socket.on('send games', (games) => {
      games.forEach(game => {
        this.games.push({label: game.split('.')[0], value: game.split('.')[0] })
      })
    });

    this.socket.on('game output', (out) => {
        out.forEach((line) => {
          this.game_data += line + '<br/>'
        })
      })
  }
 game_chosen(){
   this.game_data = '';
   this.socket.emit('game chosen', this.chosen_game)
 }
 clear(){
   this.game_data = '';
   this.socket.emit('command', 'look')
 }

 send(){
   this.socket.emit('command', this.command)
   this.command = '';
 }
}