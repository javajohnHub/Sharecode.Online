import {Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
 })

export class AppService  {
  disabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  constructor() {

  }
  setDisabled(dis: boolean) {
    this.disabled.next(dis);
  }

  getDisabled() {
    return this.disabled;
  }

}
