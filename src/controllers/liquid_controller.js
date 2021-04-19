// hello_controller.js
import { Controller } from "stimulus"
import { Liquid } from 'liquidjs';

export default class extends Controller {
  connect() {
    const engine = new Liquid();
    
    engine
      .parseAndRender(this.element.innerHTML, liquid_data)
      .then(html => this.element.innerHTML = html)
  }
}