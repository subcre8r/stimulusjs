import { Controller } from "stimulus"
export default class extends Controller {
  static targets = ["element"]

  go() {
    this.elementTargets.forEach((element, index) => {
      let classes = element.dataset.class.split(" ")
      classes.forEach((c, index) => {
        element.classList.toggle(c)
      })
    })
  }
}
