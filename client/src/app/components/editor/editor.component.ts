import { Component } from "@angular/core";
import { SocketService } from "../../shared/socket.service";
import { AppService } from 'src/app/shared/app.service';
declare var CodeMirror: any;
@Component({
  selector: "app-editor",
  templateUrl: "editor.component.html"
})
export class EditorComponent {
  selectedTheme: any = "ambiance";
  selectedMode: any;
  socket: any;
  themes;
  languages;
  disabled;
  constructor(private appService: AppService) {
    this.appService.getDisabled().subscribe((dis) => {
      this.disabled = dis;
    });
    console.log(this.disabled)
    this.socket = SocketService.getInstance();
    this.selectedTheme = "ambiance";
    this.themes = [
      { label: "Select a Theme", value: "ambiance" },
      { label: "eclipse", value: "eclipse" },
      { label: "vibrant-ink", value: "vibrant-ink" },
      { label: "3024-day", value: "3024-day" },
      { label: "3024-night", value: "3024-night" },
      { label: "monokai", value: "monokai" },
      { label: "midnight", value: "midnight" },
      { label: "night", value: "night" },
      { label: "railscasts", value: "railscasts" },
      { label: "solarized", value: "solarized" },
      { label: "ambiance", value: "ambiance" },
      { label: "abcdef", value: "abcdef" },
      { label: "ambiance-mobile", value: "ambiance-mobile" },
      { label: "base16-dark", value: "eclbase16-darkipse" },
      { label: "base16-light", value: "base16-light" },
      { label: "bespin", value: "bespin" },
      { label: "blackboard", value: "blackboard" },
      { label: "cobalt", value: "cobalt" },
      { label: "colorforth", value: "colorforth" },
      { label: "dracula", value: "dracula" },
      { label: "duotone-light", value: "duotone-light" },
      { label: "duotone-dark", value: "duotone-dark" },
      { label: "elegant", value: "elegant" },
      { label: "erlang-dark", value: "erlang-dark" },
      { label: "hopscotch", value: "hopscotch" },
      { label: "icecoder", value: "icecoder" },
      { label: "isotope", value: "isotope" },
      { label: "lesser-dark", value: "lesser-dark" },
      { label: "liquibyte", value: "liquibyte" },
      { label: "material", value: "material" },
      { label: "mbo", value: "mbo" },
      { label: "mdn-like", value: "mdn-like" },
      { label: "neat", value: "neat" },
      { label: "neo", value: "neo" },
      { label: "panda-syntax", value: "panda-syntax" },
      { label: "paraiso-light", value: "paraiso-light" },
      { label: "paraiso-dark", value: "paraiso-dark" },
      { label: "pastel-on-dark", value: "pastel-on-dark" },
      { label: "rubyblue", value: "rubyblue" },
      { label: "seti", value: "seti" },
      { label: "the-matrix", value: "the-matrix" },
      { label: "tomorrow-night-bright", value: "tomorrow-night-bright" },
      { label: "tomorrow-night-eighties", value: "tomorrow-night-eighties" },
      { label: "ttcn", value: "ttcn" },
      { label: "twilight", value: "twilight" },
      { label: "xq-dark", value: "xq-dark" },
      { label: "xq-light", value: "xq-light" },
      { label: "yeti", value: "yeti" },
      { label: "zenburn", value: "zenburn" }
    ];
    this.languages = [
      { label: "Select Language", value: "javascript" },
      { label: "javascript", value: "javascript" },
      { label: "python", value: "python" },
      { label: "php", value: "php" },
      { label: "ruby", value: "ruby" },
      { label: "clojure", value: "clojure" },
      { label: "coffeescript", value: "coffeescript" },
      { label: "clike", value: "clike" },
      { label: "css", value: "css" },
      { label: "markdown", value: "markdown" },
      { label: "htmlmixed", value: "htmlmixed" },
      { label: "xml", value: "xml" },
      { label: "jsx", value: "jsx" }
    ];
  }
  onThemeChange(newValue) {
    this.selectedTheme = newValue;
    this.socket.emit("theme", this.selectedTheme);
  }

  onModeChange(newValue) {
    this.selectedMode = newValue;
    this.socket.emit("mode", this.selectedMode);
  }
}
