// hello_controller.js
import { Controller } from "stimulus"
import { Liquid } from 'liquidjs';

export default class extends Controller {
  static targets = [ "input", "output" ]

  connect() {
    const engine = new Liquid();
    this.inputTarget.style.display = "none";

    engine
      .parseAndRender(this.inputTarget.innerHTML, data)
      .then(html => this.outputTarget.innerHTML = html)
  }
}