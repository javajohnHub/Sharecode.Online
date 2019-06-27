import {Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
 })

export class AppService  {
  disabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  editor: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  constructor() {

  }
  setDisabled(dis: boolean) {
    this.disabled.next(dis);
  }

  setEditor(editor) {
    this.editor.next(editor);
  }

  getEditor() {
    return this.editor;
  }
  getDisabled() {
    return this.disabled;
  }

}
