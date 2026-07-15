// script.js: Bubbles wrote this himself. Do not make fun of his variable names.
// (Wondering if a code is stashed in here? Read closely. Bubbles is
//  smarter than that. Mostly.)

console.log(
  "%c🐠 blub blub. There are no codes in the console. Go poke the HTML and CSS!",
  "font-size: 15px; background: lightblue; color: #17364a; padding: 8px 12px; border-radius: 8px;"
);

// Bubbles encrypts his secrets now. He read one (1) article about
// cryptography. These only turn back into words while the page is running.
const ghostLine = document.getElementById("ghost-line");
ghostLine.textContent = atob("VGhlIHNlY29uZCBjb2RlIGlzIGdob3N0LXBlcHBlcg==");

// The emergency snack buttons: three decoys, and one button that listens.
// Every click, Bubbles gets a little more annoyed.
const complaints = [
  "no.",
  "still no.",
  "Bubbles is ignoring you.",
  "seriously. stop pushing my buttons.",
  "okay, okay! you win. ONE more click and I'll unlock it.",
];

let clicks = 0;

const button = document.getElementById("snack-button");
const vault = document.getElementById("vault");

button.addEventListener("click", function () {
  if (clicks < complaints.length) {
    alert(complaints[clicks]);
    clicks = clicks + 1;
  } else {
    vault.textContent =
      "🔓 OPEN. " + atob("VGhlIHNldmVudGggY29kZSBpcyBsb3VkLWJ1dHRvbg==") + ". Please do not tell the teacher.";
    vault.classList.add("open");
    alert("There. I've unlocked my vault. It's somewhere on this page. Go find it, and stop pushing my buttons.");
  }
});
