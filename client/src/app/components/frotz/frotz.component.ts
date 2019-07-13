import { Component, ElementRef, ViewChild} from '@angular/core';
import {SocketService} from '../../shared/socket.service';
import {SelectItem} from 'primeng/api';
import * as uuid from 'uuid';
@Component({
  selector: 'app-frotz',
  template: `
    <p-dropdown [options]="games" [(ngModel)]="chosen_game" (onChange)="game_chosen()"></p-dropdown>
    <button pButton type="button" label="Clear"(click)="clear()"></button>
    <button pButton type="button" label="Save"  (click)="save()"></button>
    <button pButton type="button" label="Load Game"  (click)="load()"></button>
    <div #scrollMe style="height:500px;overflow: scroll;border:1px solid black">
    <div  *ngIf="game_data" [innerHTML]="game_data"></div><br/>
    </div>

    <input type="text" (keydown.enter)="send()" pInputText [(ngModel)]="command"/><button pButton type="button" label="Send"  (click)="send()"></button>

  `
})
export class FrotzComponent {
  socket: any;
  games: SelectItem[] = [];
  chosen_game: string;
  game_data = '';
  command: string;
  myId;
  @ViewChild("scrollMe", { static: false })
  private myScrollContainer: ElementRef;
  constructor() {
    this.socket = SocketService.getInstance();
    this.socket.emit('get games');
  }

  ngOnInit(){
    if(!localStorage.getItem('id')){
      this.myId = uuid.v4();
      localStorage.setItem('id', this.myId)
    }else{
      this.myId = localStorage.getItem('id');
    }

    this.socket.on('send games', (games) => {
      games.forEach(game => {
        this.games.push({label: game.split('.')[0], value: game.split('.')[0] })
      })
    });

    this.socket.on('game output', (out) => {
        out.forEach((line) => {
          if(line !== '>'){
            this.game_data += line + '<br/>'
          }

        })
        this.game_data += '<hr/>';
      })
  }
 game_chosen(){
   this.game_data = '';
   this.socket.emit('game chosen', this.chosen_game)
 }
 clear(){
   this.game_data = '';
   this.socket.emit('command', 'L')
 }

 send(){
   this.socket.emit('command', this.command)
   this.command = '';
 }

 save(){
  this.socket.emit('command', 'save');
  this.socket.emit('command', 'save/' + this.chosen_game + '_' + this.myId + '.sav')
 }
 load(){
  this.socket.emit('command', 'restore');
  this.socket.emit('command', 'save/' + this.chosen_game + '_' + this.myId + '.sav')
  this.socket.emit('command', 'L');
 }

 scrollToBottom(): void {
  try {
    this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
  } catch (err) {}
}
}