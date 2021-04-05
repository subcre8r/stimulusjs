import { Controller } from "stimulus"
export default class extends Controller {
  static targets = ["output"]

  insert() {
    this.outputTargets.forEach((op, index) => {
      let classes = op.dataset.class.split(" ")
      classes.forEach((c, index) => {
        op.classList.toggle(c)
      })
    })
  }
}
