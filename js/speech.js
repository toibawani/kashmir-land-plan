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
 * Pausing deserves a word of honesty too. Pause and resume follow the
 * browser's own voice control, and a couple of browsers answer a resume with
 * silence. So pausing is offered as a convenience for a doorbell moment, and
 * stopping and starting again is always there as the path that works
 * everywhere.
 *
 * Interface
 *   MLMP_SPEECH.supported()                        true when the browser offers synthesis
 *   MLMP_SPEECH.speak(textOrSections, { onState, onSection, lang, limit })
 *     textOrSections  either a plain string, or an array of
 *                     { label, text } sections read in order
 *   MLMP_SPEECH.pause() / resume() / paused()
 *   MLMP_SPEECH.stop()
 *   MLMP_SPEECH.speaking()
 *
 * onState receives "starting", "speaking", "paused", "resumed", "done",
 * "stopped" or "unavailable". onSection receives (index, total, label) each
 * time a new section begins, and only for multi-section reads, so a plain
 * string reads exactly as it always did.
 */
(function () {
  "use strict";

  var synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  var chunks = [];
  var index = 0;
  var onState = null;
  var onSection = null;
  var stopped = true;
  var paused = false;
  var multiSection = false;

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

  function emitSection() {
    // Announce the section the next chunk belongs to, but only when the read
    // was given named sections. A plain string keeps the old quiet behaviour.
    if (typeof onSection !== "function" || !multiSection) return;
    var chunk = chunks[index];
    if (!chunk) return;
    try {
      onSection(chunk.section, chunks.total, chunk.label);
    } catch (_) {}
  }

  function speakNext() {
    if (stopped || index >= chunks.length) {
      return;
    }
    // Nothing may start while paused except a resume. Browsers throw the
    // utterance away if it is queued behind a paused voice, so wait instead.
    if (paused) return;
    emitSection();
    var utterance = new window.SpeechSynthesisUtterance(chunks[index].text);
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
      if (paused) return;
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

  // Before speaking, throw away anything that is only useful on paper.
  // Section rules made of equals signs, lone dashes and the like sound like
  // "equals equals equals" when read literally, so lines with no letters in
  // them become a pause instead of noise.
  function speakable(text) {
    return String(text || "")
      .split("\n")
      .map(function (line) {
        return /[A-Za-z]/.test(line) ? line : ".";
      })
      .join(" ");
  }

  function speak(input, opts) {
    opts = opts || {};
    onState = opts.onState || null;
    onSection = opts.onSection || null;
    if (!supported()) {
      emit("unavailable");
      return false;
    }
    var sections = [];
    if (Array.isArray(input)) {
      input.forEach(function (part) {
        var label = part && part.label ? String(part.label) : "";
        var body = speakable(part && part.text).trim();
        if (body) sections.push({ label: label, text: body });
      });
    } else {
      var body = speakable(input).trim();
      if (body) sections.push({ label: "", text: body });
    }
    // Nothing worth saying is not an error, it just means the caller handed
    // over headings with no body. Say so plainly rather than sitting silent.
    if (!sections.length) {
      emit("unavailable");
      return false;
    }
    stop();
    stopped = false;
    multiSection = sections.length > 1;
    // Chunks keep their section number, so the interface can name the part
    // being read while the voice is still inside it.
    chunks = [];
    sections.forEach(function (part, i) {
      splitIntoChunks(part.text, opts.limit).forEach(function (text) {
        chunks.push({ section: i, label: part.label, text: text });
      });
    });
    chunks.total = sections.length;
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
    paused = false;
    chunks = [];
    index = 0;
    multiSection = false;
    if (!synth) return;
    try {
      synth.cancel();
    } catch (_) {}
  }

  // Pausing and resuming lean on the browser's own voice control. Most phones
  // honour a resume; a few answer with silence, in which case the farmer can
  // always stop and start again. Both paths say what happened through onState.
  function pause() {
    if (!speaking() || paused) return false;
    if (!synth) return false;
    try {
      synth.pause();
    } catch (_) {
      return false;
    }
    paused = true;
    emit("paused");
    return true;
  }

  function resume() {
    if (!speaking() || !paused) return false;
    if (!synth) return false;
    try {
      synth.resume();
    } catch (_) {
      return false;
    }
    paused = false;
    emit("resumed");
    return true;
  }

  function isPaused() {
    return paused && speaking();
  }

  function speaking() {
    return !stopped && supported();
  }

  window.MLMP_SPEECH = {
    supported: supported,
    speak: speak,
    pause: pause,
    resume: resume,
    paused: isPaused,
    stop: stop,
    speaking: speaking,
    // Exposed so the test for the chunker does not need to reach inside.
    _split: splitIntoChunks,
  };
})();
