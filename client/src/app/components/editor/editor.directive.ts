import { Directive, Renderer, Input, HostListener } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
import { AppService } from 'src/app/shared/app.service';
declare var CodeMirror: any;

@Directive({
  selector: "[editor]"
})
export class EditorDirective {
  editor: any;
  socket: any;
  @Input()
  selectedTheme: any = {};
  constructor(private _renderer: Renderer, private appService: AppService) {}

  ngAfterViewInit() {
    this.socket = SocketService.getInstance();
    this.editor = CodeMirror.fromTextArea(
      this._renderer.selectRootElement("[editor]"),
      {
        lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
        lineWrapping: true,
        tabSize: 4,
        mode: {
          name: "javascript",
          globalVars: true
        }
      }
    );
    this.appService.setEditor(this.editor);
    this.editor.setOption("theme", "ambiance");
    this.socket.on("refresh", data => {
    this.editor.setValue(data);
      });

    this.socket.on("change", data => {
      this.editor.replaceRange(data.text, data.from, data.to);
    });
    this.socket.on("send theme", data => {
      this.editor.setOption("theme", data);
    });

    this.socket.on("send mode", data => {
      this.editor.setOption("mode", data);
    });
    this.socket.on("disable", data => {
      console.log('disabled')
      this.appService.setDisabled(true);
      this.editor.setOption("readOnly", true);
    });
    this.editor.on("change", (i, op) => {
     this.socket.emit("change", op);
      this.socket.emit("refresh", this.editor.getValue());

    });
    this.editor.on("blur", () => {
      console.log('enabled')
      this.socket.emit("enable");
     });

     this.socket.on('enable', () => {
      this.appService.setDisabled(false)
      this.editor.setOption("readOnly",false);
     })
  }
}
