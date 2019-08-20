import { Component, ElementRef, ViewChild, HostListener} from '@angular/core';
import {SocketService} from '../../shared/socket.service';
import {SelectItem} from 'primeng/api';
import * as uuid from 'uuid';
@Component({
  selector: 'app-frotz',
  template: `
    <p-dropdown [options]="games" [(ngModel)]="chosen_game" (onChange)="game_chosen()"></p-dropdown>
    <button pButton type="button" label="Save"  (click)="save()"></button>
    <button *ngIf="chosen_game" pButton type="button" label="Load Game"  (click)="load()"></button>
    <div #scrollMe style="min-height:200px;">
    <div  style="border: 1px solid white;padding:20px;background-color:rgba(0,0,0,0.9); height:60vh; overflow-y:scroll;color:#d6f2ff;font-size:larger;" *ngIf="game_data" [innerHTML]="game_data"></div><br/>


    <input class="ui-g-10" type="text" [disabled]="inputDisabled" (keydown.enter)="send()" pInputText [(ngModel)]="command"/><button class="ui-g-2" pButton type="button" label="Send"  (click)="send()"></button>
    </div>
  `
})
export class FrotzComponent {
  socket: any;
  games: SelectItem[] = [];
  chosen_game: string;
  game_data = '';
  command: string;
  myId;
  inputDisabled = false;
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
        this.games.push({label: game.split('.')[0], value: game })
      })
    });

    this.socket.on('game output', (out) => {
      this.game_data = '';
        out.forEach((line) => {
          if(line !== '>' && line !== '>>'){
            this.game_data += line + '<br/>'
          }
          if(line.startsWith('Please enter a filename')){
            console.log('line','Please')
            this.command = 'save/' + this.chosen_game + '_' + this.myId + '.sav';
            this.inputDisabled = true;
          }
          if(line === 'Ok.'){
            console.log('line','Ok.')
            this.command = 'Look'
          }
          if(line.startsWith('Overwrite existing file?')){
            console.log('line','Overwrite existing file?')
            this.command = 'yes'
          }

        })


      })


  }

  @HostListener("window:beforeunload", ["$event"])
  unloadHandler(event: Event) {
    this.socket.emit("disconnected child");
  }
 game_chosen(){
   this.game_data = '';
   this.socket.emit('game chosen', this.chosen_game)
 }

 send(){
   this.socket.emit('command', this.command)
   this.command = '';
   this.inputDisabled = false;
 }

 save(){
  this.socket.emit('command', 'save');

 }
 load(){
  this.socket.emit('command', 'restore');
  this.command = 'save/' + this.chosen_game + '_' + this.myId + '.sav';
 }

 scrollToBottom(): void {
  try {
    this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
  } catch (err) {}
}
}