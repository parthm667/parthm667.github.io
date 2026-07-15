// script.js — Bubbles wrote this himself. Do not make fun of his variable names.
// (Wondering if a code is stashed in here? Read closely. Bubbles is
//  smarter than that. Mostly.)

console.log(
  "%c🐠 blub blub. There are no codes in the console — go poke the HTML and CSS!",
  "font-size: 15px; background: lightblue; color: #17364a; padding: 8px 12px; border-radius: 8px;"
);

// The emergency snack buttons: three decoys, and one button that listens.
// Every click, Bubbles gets a little more annoyed.
const complaints = [
  "no.",
  "still no.",
  "Bubbles is ignoring you.",
  "seriously. stop pushing my buttons.",
  "okay. wow. you are persistent.",
  "one more click and I'm telling the teacher.",
];

let clicks = 0;

document.getElementById("snack-button").addEventListener("click", function () {
  if (clicks < complaints.length) {
    alert(complaints[clicks]);
    clicks = clicks + 1;
  } else {
    alert("FINE. You win. The seventh code is " + "loud" + "-" + "button");
  }
});
