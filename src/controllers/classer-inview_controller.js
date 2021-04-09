import { Controller } from "stimulus"
export default class extends Controller {
  static targets = ["output"]

  connect() {
    document.addEventListener('scroll', this.insert);
  }

  insert() {
    // this.outputTargets.forEach((op, index) => {
    //   let classes = op.dataset.class.split(" ")
    //   classes.forEach((c, index) => {
    //     op.classList.add(c)
    //   })
    // })

    // is element in view?
    if (this.inView) {
      let classes = this.outputTarget.dataset.class.split(" ")
      classes.forEach((c, index) => {
        // element is in view, add class to element
        this.outputTarget.classList.add(c);
      })
    }
  }

  inView() {
    // get window height
    let windowHeight = window.innerHeight;
    // get number of pixels that the document is scrolled
    let scrollY = window.scrollY || window.pageYOffset;

    // get current scroll position (distance from the top of the page to the bottom of the current viewport)
    let scrollPosition = scrollY + windowHeight;
    // get element position (distance from the top of the page to the bottom of the element)
    let elementPosition = this.outputTarget.getBoundingClientRect().top + scrollY + this.outputTarget.clientHeight;
    
    // is scroll position greater than element position? (is element in view?)
    if (scrollPosition > elementPosition) {
      return true;
    }
    
    return false;
  }
}
