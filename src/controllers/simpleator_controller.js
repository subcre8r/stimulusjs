// import { Controller } from "@hotwired/stimulus"
import { Controller } from "stimulus"

export default class extends Controller {
  static targets = ["content", "output", "total", "savedContent"]

  connect() {
    this.contentTarget.innerHTML = this.savedContentTarget.value
    this.refresh()
    this.contentTarget.addEventListener("keyup", this.handleKeyup)
    this.contentTarget.addEventListener("paste", this.handlePaste)
  }

  disconnect() {
    this.contentTarget.removeEventListener("keyup", this.handleKeyup)
    this.contentTarget.removeEventListener("paste", this.handlePaste)
  }

  // -------------------
  // Processing Simp
  // -------------------
  refresh() {
    var content = this.contentTarget.innerText;
    this.savedContentTarget.value = this.contentTarget.innerHTML;

    this.processPresimps();

    content = content.replace(/\n\n/g, '\n')
    var lines = content.split("\n");

    var results = this.processLines(lines);
    // var converted = this.convertContent(lines); // use this for debugging, add breakpoints, etc

    this.outputTarget.innerHTML = results.processed.join("");

    try {
      var sum = results.totaling.reduce(this.getSum);
      if (results.money) {
        this.totalTarget.innerHTML = `$${sum.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
      } else {
        this.totalTarget.innerHTML = Number(sum.toFixed(13));
      }
    } catch (err) {
      console.log(`Something went wrong totaling! ${err}`);
      this.totalTarget.innerHTML = ""
    }
  }

  processPresimps() {
    var lines = this.data.get("presimps").split("\n");
    lines.push("mod = function(a,b) { return a % b; }");
    var results = this.processLines(lines);
  }

  processLine(line) {
    var result = {hide: false, money: false, line: ""}

    if (line.startsWith("//")) {
       line = line.substr(2)
       result.hide = true
    }

    if (line.includes('function')) {
      result.line = line
    } else {
      line = line.replace(/ /g, '')
      result.line = line

      if (line.includes("$")) {
        result['money'] = true
        result['line'] = result.line.replace(/\$/g, '')
      }

      var ary = this.disassemble(result.line).filter(function(el) {return el != "";});
      ary = this.convertPercents(ary);
      result.line = this.assemble(ary)
    }

    return result
  }

  processLines(lines) {
    var processed = [];
    var totaling = [];
    var money_global = false;

    for (var line of lines) {
      var result = "";
      var money = false
      var hide = false
      try {
        var proc = this.processLine(line);
        result = eval_line(proc.line);

        if (proc.hide) {
          hide = true
        }

        if (proc.money) {
          money_global = true;
          money = true;
        }

      } catch (err) {
        // result = "";
        result = undefined;
        console.log(`Something went wrong processing line! ${err}`);
        // if (err instanceof SyntaxError) {
        //   console.log(`Something went wrong! ${err.message}`);
        // }
      }

      // totaling and updating output display
      if (this.isNumber(result)) {
        if (hide) {
          processed.push("<br>")
        } else {
          var num = Number(result);
          totaling.push(num);
          if (money) {
            processed.push(`<div>$${num.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>`)
          } else {
            processed.push(`<div>${Number(num.toFixed(13))}</div>`)
          }
        }
      } else {
        processed.push("<br>")
      }

    }

    return {processed: processed, totaling: totaling, money: money_global}
  }

  // ----------------
  // Conversions
  // ----------------
  convertPercents(ary) {
    // NOTES
    //  - Percents are applied to pre-term unless using of,off,on
    //  - Percents are not applied to post-term, it'll just do a straight conversion
    //    - this allows you to use decimal value properly
    //      e.g. (7% + 10) + 7 =>  (.07 + 10) + 7
    //  - if at any time eval finds a "of, on, off" it'll err out, which is what we want; and it will result in a 0 in the output display
    //      e.g. (100 + 7%) of 10
    for (var i = 0; i<ary.length; i++) {
      if(ary[i].includes("%")) {
        // if post-symbol is ["off", "on", "of"] then percent is applied to post-term
        // e.g.
        //    7% of  100 => .07*100
        //    7% off 100 => (1-.07)*100
        //    7% on  100 => (1+.07)*100
        //    (7% + 100) => (.07 + 100) straight-conversion
        if(RegExp(["on", "off", "of"].join("|")).test(ary[i + 1])) {
          let parenth = ""
          if (ary[i - 1].includes("(")) { parenth = "(" }
          let item = ary[i - 1].replace("(", "")

          if (ary[i + 1] == "on") {
            ary[i - 1] = `${parenth}(1+${((Number(item)/100))})`
          } else if (ary[i + 1] == "off") {
            ary[i - 1] = `${parenth}(1-${((Number(item)/100))})`
          } else if (ary[i + 1] == "of") {
            ary[i - 1] = `${parenth}${(Number(item)/100)}`
          }

          ary[i] = "";
          ary[i + 1] = "*";


        // else if pre-term has "(" then do a straight conversion
        } else if(ary[i -1].includes("(")){
          let item = ary[i - 1].replace("(", "")
          let next_item = ary[i+2].replace(")", "")
          ary[i - 1] = `((${(Number(item)/100)})`
          ary[i] = "";

        // else if pre-symbol has ["+", "-"] then percent is applied to pre-term
        // e.g.
        //    100 + 7% => 100 + (.07*100)
        //    100 - 7% => 100 - (.07*100)
        } else if(RegExp(/\+|\-/).test(ary[i - 2])) {
          if (ary[i - 2] == "+") {
            ary[i - 1] = `(1+${((Number(ary[i - 1])/100))})`
          } else if (ary[i - 2] == "-") {
            ary[i - 1] = `(1-${((Number(ary[i - 1])/100))})`
          }
          ary[i] = "";
          ary[i - 2] = "*";

        // NOTE: ** THIS DOESN'T WORK, it'll just do a straight conversion for these situations; that's how soulver does it
        // else if post-symbol has ["+", "-"] then percent is applied to post-term
        // e.g.
        //    7% + 100 => (.07*100) + 100
        //    7% - 100 => (.07*100) - 100
        // } else if(RegExp(/\+|\-/).test(ary[i + 1])) {
        //   if (ary[i - 2] == "+") {
        //     ary[i - 1] = `(1+${((Number(ary[i - 1])/100))})`
        //   } else if (ary[i - 2] == "-") {
        //     ary[i - 1] = `(1-${((Number(ary[i - 1])/100))})`
        //   }
        //   ary[i] = "";
        //   ary[i - 2] = "*";

        // else if it's just 2 items and second item is %, then display number decorated with %
        } else if((ary.length == 2) && ary[1] == "%") {
          ary[i] = "";
          ary[i - 1] = `${ary[i - 1]}`

        // else it's a straight conversion
        } else {
          ary[i] = "";
          ary[i - 1] = `${(Number(ary[i - 1])/100)}`
        }
      }
    }

    return ary
  }

  convertContent(lines) {
    var processed = [];

    for (var line of lines) {
      try {
        // result = eval_line(proc.line);
        // let newline = line
        let newline = this.processLine(line);
        processed.push(newline)
      } catch (err) {
        result = "";
        console.log(`Something went wrong converting line! ${err}`);
      }
    }

    return processed
  }

  // ------------------
  // Event Listeners
  // ------------------
  handleKeyup = (event) => {
    this.refresh()
  }

  handlePaste = (event) => {
    var clipboardData, pastedData;

    // Stop data actually being pasted into div
    event.stopPropagation();
    event.preventDefault();

    // Get pasted data via clipboard API
    clipboardData = event.clipboardData || window.clipboardData;
    // console.log(clipboardData)
    pastedData = clipboardData.getData('Text');
    // pastedData = clipboardData.getData('text/plain');
    var lines = pastedData.split("\n")

    var insertThis = ""
    for( var i = 0; i < lines.length; i++) {
      if(lines[i] == "") {
        insertThis += `<br>`
      } else {
        insertThis += `<div>${lines[i]}</div>`
      }
    }

    // Do whatever with pasteddata
    // this.contentTarget.innerHTML = insertThis
    document.execCommand("insertHTML", false, insertThis);

    // ==========================
    // ==========================
    // ==========================

    // // cancel paste
    // event.preventDefault();

    // // get text representation of clipboard
    // var text = (event.originalEvent || event).clipboardData.getData('text/plain');

    // // insert text manually
    // document.execCommand("insertHTML", false, text);
  }

  // --------------
  // Helpers
  // --------------
  disassemble(line) {
    // line = line.replace(/%/g, ";perc;")
    var delim = /(;perc;|%|\+|\-|\/|\*|off|of|on|=)/g;

    return line.split(delim)
  }

  assemble(ary) {
    var result = ary.join("")
    result = result.replace(/%/, "")
    result = result.replace(/;perc;/, "%")

    return result
  }

  isNumber(result) {
    if (result == undefined) { return false; }
    if (Number(result) == NaN) { return false; }
    if ((typeof result) == "function") { return false; }
    return true;
  }

  getSum(total, num) {
    return total + num
  }
}