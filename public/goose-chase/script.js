/* ==========================================================================
   The Wild Goose Chase — the engine.

   Yes, you're allowed to read this. You won't find any codes in here, and
   that's the whole trick: every piece of evidence past the first is stored
   encrypted in chase-data.js. The key for evidence N is the CODE from
   evidence N-1, run through PBKDF2. So the browser genuinely cannot show you
   evidence 07 until you've solved 06 — the words don't exist on your computer
   until the right code decrypts them.

   Which means the only way forward is forward. Sorry. Go look at the page.
   ========================================================================== */

(function () {
  "use strict";

  var STORE = "goose-chase-progress";
  var TOTAL = 10;
  var POINTS_EACH = 20;

  var data = window.CHASE_DATA;
  var trail = document.getElementById("trail");
  var form = document.getElementById("answer-form");
  var input = document.getElementById("answer");
  var submitBtn = document.getElementById("answer-submit");
  var label = document.getElementById("answer-label");
  var feedback = document.getElementById("feedback");
  var dock = document.getElementById("dock");
  var notes = document.getElementById("notes");
  var notesList = document.getElementById("notes-list");
  var fill = document.getElementById("progress-fill");
  var countEl = document.getElementById("progress-count");
  var pointsEl = document.getElementById("progress-points");

  /** Codes recovered, in order, in their pretty dashed form. */
  var codes = [];
  /** Exactly what the student typed (normalised), so progress can be replayed. */
  var keys = [];
  var busy = false;

  /* ---- helpers --------------------------------------------------------- */

  // Case, spaces and punctuation never matter: "Shy Tomato!" === "shy-tomato".
  function normalise(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function fromBase64(b64) {
    var raw = atob(b64);
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function say(message, tone) {
    feedback.textContent = message;
    feedback.className = "dock__feedback" + (tone ? " is-" + tone : "");
  }

  /* ---- the lock -------------------------------------------------------- */

  function deriveKey(code, salt) {
    return crypto.subtle
      .importKey("raw", new TextEncoder().encode(normalise(code)), "PBKDF2", false, ["deriveKey"])
      .then(function (material) {
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: salt, iterations: data.it, hash: "SHA-256" },
          material,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      });
  }

  // Resolves with the stage payload, or rejects if the code is wrong. AES-GCM
  // authenticates its ciphertext, so a wrong key doesn't decode to garbage —
  // it fails outright. The cipher is the answer checker.
  function unlock(code, blob) {
    return deriveKey(code, fromBase64(blob.s)).then(function (key) {
      return crypto.subtle
        .decrypt({ name: "AES-GCM", iv: fromBase64(blob.iv) }, key, fromBase64(blob.ct))
        .then(function (plain) {
          return JSON.parse(new TextDecoder().decode(plain));
        });
    });
  }

  /* ---- rendering ------------------------------------------------------- */

  function markSolved(stageNumber, code) {
    var card = document.getElementById("ev-" + stageNumber);
    if (!card || card.querySelector(".evidence__solved")) return;
    card.classList.remove("is-current");
    card.classList.add("is-solved");

    var line = document.createElement("p");
    line.className = "evidence__solved";
    line.innerHTML = "✅ Recovered · <code></code>";
    line.querySelector("code").textContent = code;
    card.appendChild(line);
  }

  function renderStage(payload, animate) {
    if (payload.css) {
      var style = document.createElement("style");
      style.textContent = payload.css;
      document.head.appendChild(style);
    }

    var card = document.createElement("article");
    card.className = "evidence is-current" + (payload.victory ? " evidence--victory" : "");
    if (animate) card.classList.add("evidence--new");
    card.id = "ev-" + payload.n;

    var head = document.createElement("header");
    head.className = "evidence__head";
    var num = document.createElement("span");
    num.className = "evidence__num";
    num.textContent = payload.victory ? "★" : pad(payload.n);
    var title = document.createElement("h2");
    title.className = "evidence__title";
    title.textContent = payload.title;
    head.appendChild(num);
    head.appendChild(title);
    card.appendChild(head);

    if (payload.hint) {
      var hint = document.createElement("p");
      hint.className = "evidence__hint";
      var hintLabel = document.createElement("span");
      hintLabel.className = "evidence__hint-label";
      hintLabel.textContent = "Hint";
      hint.appendChild(hintLabel);
      hint.appendChild(document.createTextNode(payload.hint));
      card.appendChild(hint);
    }

    var body = document.createElement("div");
    body.className = "evidence__body";
    body.innerHTML = payload.html;
    card.appendChild(body);

    trail.appendChild(card);
    return card;
  }

  function refreshProgress() {
    var solved = codes.length;
    countEl.textContent = String(solved);
    pointsEl.textContent = String(solved * POINTS_EACH);
    fill.style.width = (solved / TOTAL) * 100 + "%";

    if (solved > 0) {
      notes.hidden = false;
      notesList.innerHTML = "";
      codes.forEach(function (code) {
        var li = document.createElement("li");
        li.textContent = code;
        notesList.appendChild(li);
      });
    }

    if (solved >= TOTAL) {
      dock.classList.add("is-done");
      label.textContent = "All ten recovered";
      say("Case closed. Put every code on the form.", "good");
    } else {
      label.textContent = "Code for Evidence " + pad(solved + 1);
    }
  }

  function celebrate() {
    var goose = document.createElement("img");
    goose.src = "goose.png";
    goose.alt = "";
    goose.className = "goose-run";
    document.body.appendChild(goose);
    setTimeout(function () {
      goose.remove();
    }, 7000);
  }

  /* ---- accepting an answer --------------------------------------------- */

  function accept(payload, code, animate) {
    keys.push(normalise(code));
    codes.push(payload.confirmed);
    markSolved(payload.n - 1, payload.confirmed);
    renderStage(payload, animate);
    refreshProgress();
  }

  function attempt(raw) {
    var guess = normalise(raw);
    if (!guess) return;

    var blob = data.blobs[codes.length];
    if (!blob) return;

    busy = true;
    submitBtn.disabled = true;
    say("Checking…");

    unlock(guess, blob)
      .then(function (payload) {
        accept(payload, raw, true);
        input.value = "";
        localStorage.setItem(STORE, JSON.stringify(keys));
        if (payload.victory) {
          celebrate();
        } else {
          say("Correct. Evidence " + pad(payload.n) + " is on the board.", "good");
          document.getElementById("ev-" + payload.n).scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      })
      .catch(function () {
        say("That's not it. The goose is unimpressed.", "bad");
        dock.classList.add("dock--shake");
        setTimeout(function () {
          dock.classList.remove("dock--shake");
        }, 400);
      })
      .then(function () {
        busy = false;
        submitBtn.disabled = false;
        input.focus();
      });
  }

  /* ---- restoring a session in progress --------------------------------- */

  function restore() {
    var saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORE) || "[]");
    } catch (err) {
      saved = [];
    }
    if (!Array.isArray(saved) || !saved.length) return Promise.resolve();

    say("Restoring your progress…");

    // Replay the answers in order. If one no longer fits (the chase was
    // rebuilt with new codes), stop there and keep what still works.
    return saved.reduce(function (chain, code) {
      return chain.then(function (stillGood) {
        if (!stillGood) return false;
        var blob = data.blobs[codes.length];
        if (!blob) return false;
        return unlock(code, blob).then(
          function (payload) {
            accept(payload, code, false);
            return true;
          },
          function () {
            return false;
          }
        );
      });
    }, Promise.resolve(true)).then(function () {
      keys = codes.map(function (code) {
        return normalise(code);
      });
      localStorage.setItem(STORE, JSON.stringify(keys));
      say("");
    });
  }

  /* ---- wiring ---------------------------------------------------------- */

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!busy) attempt(input.value);
  });

  document.getElementById("copy-codes").addEventListener("click", function (event) {
    var text = codes.join("\n");
    var button = event.currentTarget;
    var done = function () {
      button.textContent = "Copied!";
      setTimeout(function () {
        button.textContent = "Copy all codes";
      }, 1600);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  });

  document.getElementById("reset").addEventListener("click", function () {
    if (confirm("Wipe your progress and start the chase from evidence 01?")) {
      localStorage.removeItem(STORE);
      location.reload();
    }
  });

  if (!window.crypto || !crypto.subtle) {
    say("This page needs a secure connection (https) to unlock evidence.", "bad");
    submitBtn.disabled = true;
    return;
  }

  restore().then(refreshProgress, refreshProgress);
})();
