/**
 * Reading a plan aloud.
 *
 * A long plan is hard work to read on a phone, and harder for anyone who is
 * more comfortable in Kashmiri, Dogri, Urdu or Hindi than in English. The
 * browser can read the text out, which at least removes the reading load even
 * though the wording is still English.
 *
 * What this can and cannot promise: the voices come from the device, so the
 * accent and the availability vary a lot between phones, and some browsers
 * report a voice that then stays silent. The app therefore treats reading as a
 * bonus. Nothing depends on it, and the text is always on screen as well.
 *
 * Interface
 *   MLMP_SPEECH.supported()            true when the browser offers synthesis
 *   MLMP_SPEECH.speak(text, { onState, lang })
 *   MLMP_SPEECH.stop()
 *   MLMP_SPEECH.speaking()
 *
 * onState receives "starting", "speaking", "done", "stopped" or "unavailable".
 */
(function () {
  "use strict";

  var synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  var chunks = [];
  var index = 0;
  var onState = null;
  var stopped = true;

  function supported() {
    return !!(synth && typeof window.SpeechSynthesisUtterance === "function");
  }

  function emit(state) {
    if (typeof onState === "function") {
      try {
        onState(state);
      } catch (_) {}
    }
  }

  /**
   * Prefer a voice for the region. Falls back to any English voice, and then to
   * whatever the device offers, because a wrong accent is better than silence.
   */
  function pickVoice(lang) {
    if (!synth || typeof synth.getVoices !== "function") return null;
    var voices = [];
    try {
      voices = synth.getVoices() || [];
    } catch (_) {
      return null;
    }
    if (!voices.length) return null;
    var wanted = String(lang || "en-IN").toLowerCase();
    var exact = voices.filter(function (v) {
      return String(v.lang || "").toLowerCase() === wanted;
    });
    if (exact.length) return exact[0];
    var englishIndian = voices.filter(function (v) {
      return /^en[-_]in/i.test(String(v.lang || ""));
    });
    if (englishIndian.length) return englishIndian[0];
    var english = voices.filter(function (v) {
      return /^en\b/i.test(String(v.lang || ""));
    });
    if (english.length) return english[0];
    return voices[0];
  }

  /**
   * Long text is split into sentences and grouped into short chunks. Some
   * browsers cut off a single long utterance, and a plan can easily run to
   * several thousand characters.
   */
  function splitIntoChunks(text, limit) {
    var size = limit || 180;
    // Split without a lookbehind assertion, which older Safari refuses to
    // parse at all. A sentinel keeps the sentence breaks instead.
    var sentences = String(text || "")
      .replace(/\s+/g, " ")
      .replace(/([.!?])\s+/g, "$1\u0000")
      .split("\u0000")
      .filter(function (s) {
        return s.trim().length;
      });
    var out = [];
    var buffer = "";
    sentences.forEach(function (sentence) {
      if (!buffer.length) {
        buffer = sentence;
        return;
      }
      if ((buffer + " " + sentence).length <= size) {
        buffer += " " + sentence;
      } else {
        out.push(buffer);
        buffer = sentence;
      }
    });
    if (buffer.length) out.push(buffer);
    return out;
  }

  function speakNext() {
    if (stopped || index >= chunks.length) {
      return;
    }
    var utterance = new window.SpeechSynthesisUtterance(chunks[index]);
    var voice = pickVoice("en-IN");
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-IN";
    } else {
      utterance.lang = "en-IN";
    }
    // A little slower than default. This is a plan with numbers and place
    // names in it, not a headline.
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onend = function () {
      index += 1;
      if (stopped) return;
      if (index >= chunks.length) {
        stopped = true;
        emit("done");
        return;
      }
      speakNext();
    };
    utterance.onerror = function () {
      // A cancelled utterance reports an error, which is not worth telling the
      // user about because they are the one who cancelled it.
      if (stopped) return;
      stopped = true;
      emit("unavailable");
    };
    try {
      synth.speak(utterance);
    } catch (_) {
      stopped = true;
      emit("unavailable");
    }
  }

  function speak(text, opts) {
    opts = opts || {};
    onState = opts.onState || null;
    if (!supported()) {
      emit("unavailable");
      return false;
    }
    var body = String(text || "").trim();
    if (!body) {
      emit("unavailable");
      return false;
    }
    stop();
    stopped = false;
    chunks = splitIntoChunks(body, opts.limit);
    index = 0;
    emit("starting");
    // Chrome ignores a speak() that follows a cancel() in the same tick.
    window.setTimeout(function () {
      if (stopped) return;
      emit("speaking");
      speakNext();
    }, 120);
    return true;
  }

  function stop() {
    stopped = true;
    chunks = [];
    index = 0;
    if (!synth) return;
    try {
      synth.cancel();
    } catch (_) {}
  }

  function speaking() {
    return !stopped && supported();
  }

  window.MLMP_SPEECH = {
    supported: supported,
    speak: speak,
    stop: stop,
    speaking: speaking,
    // Exposed so the test for the chunker does not need to reach inside.
    _split: splitIntoChunks,
  };
})();
