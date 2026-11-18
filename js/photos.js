/**
 * Photos of a plot.
 *
 * Three guided shots per plot: a wide view, a ground close-up, and the nearest
 * water source (which can be skipped). A photo is taken through a file input
 * with `capture`, so the browser opens the camera itself and this app never
 * asks for a camera permission. The gallery button is the same input without
 * `capture`, for a picture already on the phone.
 *
 * Before anything is stored it is redrawn onto a canvas at 1280 pixels on the
 * long edge and re-encoded as JPEG. That is not only about size: a canvas draw
 * copies pixels and nothing else, so EXIF metadata, including the GPS position
 * some cameras write, does not survive it. What is kept is a new JPEG of what
 * the farmer saw.
 *
 * Photos live in IndexedDB, keyed by the plan they belong to, and never leave
 * the device. Storage can be refused when a phone is full, so every write
 * reports whether it landed rather than assuming it did.
 *
 * Interface
 *   MLMP_PHOTOS.SLOTS                       the three guided shots
 *   MLMP_PHOTOS.prepare(file)               Promise<{ok, blob, width, height, issues}>
 *   MLMP_PHOTOS.save(planId, slot, file)    Promise<{ok, photo, issues, quota, full}>
 *   MLMP_PHOTOS.list(planId)                Promise<array of records, oldest first>
 *   MLMP_PHOTOS.remove(id)                  Promise<boolean>
 *   MLMP_PHOTOS.setNote(id, text)           Promise<boolean>
 *   MLMP_PHOTOS.sortNewest(rows)            pure, newest first, for the timeline
 *   MLMP_PHOTOS.count()                     Promise<number>
 *   MLMP_PHOTOS.assess(pixels, w, h, src)   pure quality check, for the tests
 *
 * Every retake is kept rather than replacing the shot, because a photo taken in
 * March and one taken in June are the point of the timeline. That also means a
 * plan can accumulate photos, so a cap per plan turns "the phone is full" into
 * a clear message instead of a failed write.
 */
(function () {
  "use strict";

  var DB_NAME = "mlmp_photos_v1";
  var DB_VERSION = 1;
  var STORE = "photos";
  var MAX_EDGE = 1280;
  var JPEG_QUALITY = 0.8;
  var MAX_NOTE = 140;
  var MAX_PER_PLAN = 40;
  var SLOTS = ["wide", "ground", "water"];
  var SLOT_LABELS = {
    wide: "Wide view of the plot",
    ground: "Ground close-up",
    water: "Nearest water source",
  };

  // Thresholds for the quality check. They are heuristics, chosen to catch the
  // three mistakes that make a photo useless at the counter: taken in the dark,
  // taken into the sun, and taken while moving. They are not a judge of
  // whether a photo is useful, and the message says "take it again", never
  // "this is wrong".
  var DARK_MEAN = 46;
  var BRIGHT_MEAN = 222;
  var BLUR_VARIANCE = 40;
  var MIN_SOURCE_EDGE = 480;
  var SAMPLE_EDGE = 320;

  function isSlot(name) {
    return SLOTS.indexOf(name) !== -1;
  }

  function slotLabel(name) {
    return SLOT_LABELS[name] || name;
  }

  /**
   * The quality check, on plain luminance values. Kept free of canvas so the
   * tests can drive it with a checkerboard and a flat grey.
   */
  function assess(pixels, width, height, source) {
    var issues = [];
    source = source || { width: width, height: height };

    if (Math.min(source.width || 0, source.height || 0) < MIN_SOURCE_EDGE) {
      issues.push("too_small");
    }

    var total = 0;
    var i;
    for (i = 0; i < pixels.length; i++) total += pixels[i];
    var mean = pixels.length ? total / pixels.length : 0;
    if (mean < DARK_MEAN) issues.push("too_dark");
    if (mean > BRIGHT_MEAN) issues.push("too_bright");

    // Variance of the Laplacian: a sharp photo has strong second differences
    // between neighbouring pixels, a blurred or flat one does not.
    var sum = 0;
    var sumSq = 0;
    var count = 0;
    for (var y = 1; y < height - 1; y++) {
      for (var x = 1; x < width - 1; x++) {
        var c = pixels[y * width + x];
        var lap =
          4 * c -
          pixels[(y - 1) * width + x] -
          pixels[(y + 1) * width + x] -
          pixels[y * width + x - 1] -
          pixels[y * width + x + 1];
        sum += lap;
        sumSq += lap * lap;
        count++;
      }
    }
    var variance = count ? sumSq / count - (sum / count) * (sum / count) : 0;
    if (variance < BLUR_VARIANCE) issues.push("blurry");

    return { ok: issues.length === 0, issues: issues, mean: mean, variance: variance };
  }

  function loadImage(file) {
    if (window.createImageBitmap) {
      return window.createImageBitmap(file).catch(function () {
        return loadViaElement(file);
      });
    }
    return loadViaElement(file);
  }

  function loadViaElement(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve(img);
        URL.revokeObjectURL(url);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("not an image"));
      };
      img.src = url;
    });
  }

  function scaledSize(width, height) {
    var longEdge = Math.max(width, height);
    if (longEdge <= MAX_EDGE) return { width: width, height: height };
    var ratio = MAX_EDGE / longEdge;
    return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
  }

  /**
   * Resize and re-encode. The returned blob is the only thing that is stored:
   * the canvas dropped every metadata block, so a GPS position in the original
   * is gone by the time the photo reaches IndexedDB.
   */
  function prepare(file) {
    return loadImage(file).then(function (image) {
      var source = {
        width: image.width || image.naturalWidth,
        height: image.height || image.naturalHeight,
      };
      if (!source.width || !source.height) return Promise.reject(new Error("empty image"));

      var size = scaledSize(source.width, source.height);
      var canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, size.width, size.height);

      // A small greyscale copy is enough to judge light and sharpness, and it
      // keeps the check cheap on a low-end phone.
      var small = document.createElement("canvas");
      small.width = Math.max(1, Math.round((size.width / size.height) * SAMPLE_EDGE));
      small.height = SAMPLE_EDGE;
      var sctx = small.getContext("2d");
      sctx.drawImage(canvas, 0, 0, small.width, small.height);
      var data = sctx.getImageData(0, 0, small.width, small.height).data;
      var luma = new Uint8ClampedArray(small.width * small.height);
      for (var i = 0, p = 0; i < data.length; i += 4, p++) {
        luma[p] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      var verdict = assess(luma, small.width, small.height, source);

      return new Promise(function (resolve) {
        canvas.toBlob(
          function (blob) {
            resolve({
              ok: verdict.ok,
              issues: verdict.issues,
              blob: blob,
              width: size.width,
              height: size.height,
            });
          },
          "image/jpeg",
          JPEG_QUALITY
        );
      });
    });
  }

  /* ------------------------------------------------------------ IndexedDB */

  var dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("no indexeddb"));
        return;
      }
      var request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("planId", "planId", { unique: false });
        }
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error || new Error("indexeddb refused"));
      };
    });
    // A refused open is not cached forever: a later attempt may work once the
    // browser has settled, and a stuck promise would leave the screen dead.
    dbPromise.catch(function () {
      dbPromise = null;
    });
    return dbPromise;
  }

  /**
   * Run one transaction and resolve with the request's result when it commits.
   * A transaction that aborts or errors rejects, which is what lets a full
   * phone be reported as a refused write rather than a saved photo.
   */
  function withStore(mode, run) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode);
        var store = tx.objectStore(STORE);
        var request;
        try {
          request = run(store);
        } catch (err) {
          reject(err);
          return;
        }
        tx.oncomplete = function () {
          resolve(request ? request.result : undefined);
        };
        tx.onerror = function () {
          reject(tx.error || new Error("storage failed"));
        };
        tx.onabort = function () {
          reject(tx.error || new Error("storage aborted"));
        };
      });
    });
  }

  function newId() {
    return "ph" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function isQuotaError(err) {
    if (!err) return false;
    if (err.name === "QuotaExceededError") return true;
    return /quota/i.test(String(err.message || ""));
  }

  function save(planId, slot, file) {
    if (!planId || !isSlot(slot)) {
      return Promise.resolve({ ok: false, issues: [], failed: true });
    }
    return list(planId)
      .then(function (existing) {
        if (existing.length >= MAX_PER_PLAN) return { ok: false, full: true, issues: [] };
        return savePrepared(planId, slot, file);
      });
  }

  function savePrepared(planId, slot, file) {
    return prepare(file)
      .then(function (prepared) {
        if (!prepared.blob) return { ok: false, issues: prepared.issues, failed: true };
        // A photo that failed the quality check is not stored at all. Keeping
        // it "just in case" would put a dark, blurred picture on the printed
        // card, where the farmer cannot see that it is useless until an
        // officer does.
        if (!prepared.ok) return { ok: false, rejected: true, issues: prepared.issues };
        var record = {
          id: newId(),
          planId: planId,
          slot: slot,
          createdAt: new Date().toISOString(),
          blob: prepared.blob,
          width: prepared.width,
          height: prepared.height,
        };
        return withStore("readwrite", function (store) {
          return store.put(record);
        })
          .then(function () {
            return { ok: true, photo: record, issues: prepared.issues };
          })
          .catch(function (err) {
            return {
              ok: false,
              issues: prepared.issues,
              quota: isQuotaError(err),
              failed: !isQuotaError(err),
            };
          });
      })
      .catch(function (err) {
        return { ok: false, issues: [], failed: true, error: String(err && err.message) };
      });
  }

  function list(planId) {
    if (!planId) return Promise.resolve([]);
    return withStore("readonly", function (store) {
      return store.index("planId").getAll(planId);
    })
      .then(function (rows) {
        return (rows || []).sort(function (a, b) {
          return String(a.createdAt).localeCompare(String(b.createdAt));
        });
      })
      .catch(function () {
        return [];
      });
  }

  /**
   * Keep one short note with one photo. The text is squeezed onto one line and
   * capped, so a pasted paragraph cannot turn into a wall of text on the card.
   * Resolves false when the photo is gone or the device refuses the write.
   */
  function setNote(id, text) {
    if (!id) return Promise.resolve(false);
    var value = String(text == null ? "" : text)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_NOTE);
    return openDb()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(STORE, "readwrite");
          var store = tx.objectStore(STORE);
          var get = store.get(id);
          var found = false;
          get.onsuccess = function () {
            var row = get.result;
            if (!row) return;
            found = true;
            row.note = value;
            store.put(row);
          };
          tx.oncomplete = function () {
            resolve(found);
          };
          tx.onerror = function () {
            reject(tx.error || new Error("storage failed"));
          };
          tx.onabort = function () {
            reject(tx.error || new Error("storage aborted"));
          };
        });
      })
      .catch(function () {
        return false;
      });
  }

  /** Newest first, for the timeline. Copies, so callers keep their own order. */
  function sortNewest(rows) {
    return (rows || []).slice().sort(function (a, b) {
      var byDate = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      if (byDate !== 0) return byDate;
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }

  function remove(id) {
    return withStore("readwrite", function (store) {
      return store.delete(id);
    })
      .then(function () {
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  /** Every photo of one plan, for when that plan is deleted. */
  function removeByPlan(planId) {
    if (!planId) return Promise.resolve(0);
    return list(planId)
      .then(function (rows) {
        return Promise.all(
          rows.map(function (row) {
            return remove(row.id);
          })
        );
      })
      .then(function (results) {
        return (results || []).filter(Boolean).length;
      })
      .catch(function () {
        return 0;
      });
  }

  /** Remove every stored photo. Used by "delete everything on this device". */
  function clearAll() {
    return withStore("readwrite", function (store) {
      return store.clear();
    })
      .then(function () {
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function count() {
    return withStore("readonly", function (store) {
      return store.count();
    })
      .then(function (n) {
        return Number(n) || 0;
      })
      .catch(function () {
        return 0;
      });
  }

  /** The latest photo in each slot, which is what the card shows. */
  function latestBySlot(rows) {
    var out = {};
    (rows || []).forEach(function (row) {
      out[row.slot] = row;
    });
    return out;
  }

  window.MLMP_PHOTOS = {
    SLOTS: SLOTS,
    MAX_NOTE: MAX_NOTE,
    MAX_PER_PLAN: MAX_PER_PLAN,
    slotLabel: slotLabel,
    isSlot: isSlot,
    assess: assess,
    prepare: prepare,
    save: save,
    list: list,
    sortNewest: sortNewest,
    setNote: setNote,
    remove: remove,
    removeByPlan: removeByPlan,
    clearAll: clearAll,
    count: count,
    latestBySlot: latestBySlot,
  };
})();
