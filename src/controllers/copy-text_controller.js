import { Controller } from "stimulus"
export default class extends Controller {
  static targets = ["text"]

  copy() {
    if (document.selection) {
      var range = document.body.createTextRange();
      range.moveToElementText(this.textTarget);
      range.select().createTextRange();
      document.execCommand("copy");
    } else if (window.getSelection) {
      var range = document.createRange();
      range.selectNode(this.textTarget);
      window.getSelection().addRange(range);
      document.execCommand("copy");
      // alert("Text has been copied, now paste in the text-area")
    }
  }
}
