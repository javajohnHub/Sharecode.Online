import { Directive, Renderer, Input } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
declare var CodeMirror: any;

@Directive({
  selector: "[editor]"
})
export class EditorDirective {
  editor: any;
  socket: any;
  @Input()
  selectedTheme: any = {};
  constructor(private _renderer: Renderer) {}

  ngAfterViewInit() {
    this.socket = SocketService.getInstance();
    this.editor = CodeMirror.fromTextArea(
      this._renderer.selectRootElement("[editor]"),
      {
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 4,
        mode: {
          name: "javascript",
          globalVars: true
        }
      }
    );
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
    this.editor.on("change", (i, op) => {
     this.socket.emit("change", op);
      this.socket.emit("refresh", this.editor.getValue());
    });
  }
}
