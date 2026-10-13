/**
 * A QR code drawn on the device, with no library and no network.
 *
 * Why this file exists. A plan reference like "MLMP-PUL-3K-8F2C" is easy to
 * read over a phone call but painful to type into a counter device. A QR code
 * the farmer holds up is read in one motion instead of a person retyping
 * twelve characters and getting one wrong.
 *
 * What it is for, and what it is not. This encodes a short string that names
 * the plan on the device it was made on. It does not link to a website, it
 * does not carry the plan itself, and scanning it on another phone shows
 * plain text and nothing else. That limit is deliberate. The moment a code
 * points at a server the plan has left the device, and this app has no server
 * and wants none. A scanner therefore shows something like:
 *
 *     MLMP-PUL-3K-8F2C
 *     My Land, My Plan plan reference, made on the device that holds the plan.
 *
 * which is the honest result: a code a counter device can read in one go.
 *
 * How it works, briefly. A QR code is a grid of modules. This encoder follows
 * the standard order: choose the smallest version that fits, write the data in
 * byte mode with its count indicator, split into blocks, add Reed-Solomon
 * error correction over GF(256), interleave, place the bits in the standard
 * zig-zag while skipping every function pattern, then try all eight data
 * masks, score them by the penalty rules and keep the best. Byte mode covers
 * every character a plan reference can hold, and versions 1 to 10 are far
 * more than the short string this app encodes.
 *
 * Drawing is on a canvas, so nothing external is fetched and nothing needs to
 * be installed for offline use. Where there is no canvas, nothing is drawn
 * and the app keeps showing the reference in letters, which always worked.
 */
(function () {
  "use strict";

  var MAX_VERSION = 10;

  /* Data codewords per version at level L (7 percent recovery), byte mode.
     Index 0 is version 1. */
  var DATA_CODEWORDS = [19, 34, 55, 80, 108, 136, 156, 194, 232, 274];

  /* Blocks per version at level L, as the spec lays them out:
     [blocks in group 1, codewords each in group 1,
      blocks in group 2, codewords each in group 2]. */
  var ECC_BLOCKS = [
    [1, 19, 0, 0],
    [1, 34, 0, 0],
    [1, 55, 0, 0],
    [1, 80, 0, 0],
    [1, 108, 0, 0],
    [2, 68, 0, 0],
    [4, 43, 0, 0],
    [2, 60, 2, 61],
    [2, 58, 2, 59],
    [2, 58, 4, 59],
  ];

  /* Total codewords per version, data plus error correction. */
  var TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

  /* Galois field GF(256) with primitive polynomial 0x11d, used by
     Reed-Solomon. Built once, because every code on a page shares the tables. */
  var EXP = new Array(512);
  var LOG = new Array(256);
  (function buildTables() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /** The generator polynomial for n error correction codewords. */
  function generatorPoly(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var p = 0; p < poly.length; p++) {
        next[p] ^= poly[p];
        next[p + 1] ^= gfMul(poly[p], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  /** Error correction codewords for one block of data. */
  function rsEncode(data, eccCount) {
    var gen = generatorPoly(eccCount);
    var res = new Array(eccCount).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res.shift();
      res.push(0);
      if (factor !== 0) {
        for (var j = 0; j < eccCount; j++) res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
    return res;
  }

  /** UTF-8 bytes, so any character an officer might type still survives. */
  function toBytes(text) {
    var out = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code < 0x80) out.push(code);
      else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      else if (code < 0x10000) {
        out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        out.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
        i += 1;
      }
    }
    return out;
  }

  /** The smallest version that holds this many bytes, or 0 when it will not. */
  function pickVersion(byteLength) {
    for (var v = 1; v <= MAX_VERSION; v++) {
      // Byte mode is 4 bits of mode plus a character count of 8 bits below
      // version 10 and 16 bits at version 10.
      var ccBits = v >= 10 ? 16 : 8;
      var needed = (4 + ccBits + byteLength * 8 + 7) >> 3;
      if (needed <= DATA_CODEWORDS[v - 1]) return v;
    }
    return 0;
  }

  /**
   * Mode, count, data, terminator and padding, split into blocks, error
   * correction added, then interleaved the way the standard requires.
   */
  function buildCodewords(text, version) {
    var bytes = toBytes(text);
    var capacity = DATA_CODEWORDS[version - 1];
    var ccBits = version >= 10 ? 16 : 8;

    var bits = [];
    function put(value, length) {
      for (var i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    }

    put(0x4, 4); // byte mode
    put(bytes.length, ccBits);
    bytes.forEach(function (b) {
      put(b, 8);
    });

    var left = capacity * 8 - bits.length;
    put(0, Math.min(4, left));
    while (bits.length % 8 !== 0) put(0, 1);

    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var byte = 0;
      for (var b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
      data.push(byte);
    }
    // The padding bytes alternate, so the tail never looks like an error.
    var pad = [0xec, 0x11];
    var n = 0;
    while (data.length < capacity) data.push(pad[(n++) % 2]);

    // Split into blocks, as the version table lays them out.
    var spec = ECC_BLOCKS[version - 1];
    var blocks = [];
    var offset = 0;
    for (var g = 0; g < 2; g++) {
      for (var b2 = 0; b2 < spec[g * 2]; b2++) {
        var size = spec[g * 2 + 1];
        blocks.push(data.slice(offset, offset + size));
        offset += size;
      }
    }

    var eccPerBlock = (TOTAL_CODEWORDS[version - 1] - capacity) / blocks.length;
    var eccBlocks = blocks.map(function (blk) {
      return rsEncode(blk, eccPerBlock);
    });

    // Interleave by column, then append the interleaved error correction.
    var out = [];
    var longest = Math.max.apply(
      null,
      blocks.map(function (blk) {
        return blk.length;
      })
    );
    for (var c = 0; c < longest; c++) {
      blocks.forEach(function (blk) {
        if (c < blk.length) out.push(blk[c]);
      });
    }
    for (var e = 0; e < eccPerBlock; e++) {
      eccBlocks.forEach(function (blk) {
        out.push(blk[e]);
      });
    }
    return out;
  }

  function emptyGrid(size) {
    var grid = [];
    for (var r = 0; r < size; r++) grid.push(new Array(size).fill(0));
    return grid;
  }

  function isFinderArea(row, col, size) {
    return (
      (row < 9 && col < 9) ||
      (row < 9 && col >= size - 8) ||
      (row >= size - 8 && col < 9)
    );
  }

  /** Alignment pattern centres for a version, straight from the table. */
  function alignmentPositions(version) {
    var table = {
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
      7: [6, 22, 38],
      8: [6, 24, 42],
      9: [6, 26, 46],
      10: [6, 28, 50],
    };
    return table[version] || [];
  }

  /* Reserved modules are tracked so data placement steps over them. Two
     grids of booleans, one written by row and one by column, keeps the test
     in the placement loop cheap and reads clearly. */
  var reservedRow = [];
  var reservedCol = [];

  function reserve(size, version) {
    reservedRow = [];
    reservedCol = [];
    for (var r = 0; r < size; r++) {
      reservedRow.push(new Array(size).fill(false));
      reservedCol.push(new Array(size).fill(false));
    }
    function mark(row, col) {
      if (row < 0 || col < 0 || row >= size || col >= size) return;
      reservedRow[row][col] = true;
      reservedCol[col][row] = true;
    }

    // Three finders with their separator rings.
    var corners = [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ];
    corners.forEach(function (c) {
      for (var y = -1; y <= 7; y++) {
        for (var x = -1; x <= 7; x++) mark(c[0] + y, c[1] + x);
      }
    });

    // Timing patterns, the alternating stripes along row and column 6.
    for (var i = 8; i < size - 8; i++) {
      mark(6, i);
      mark(i, 6);
    }

    // Alignment patterns, skipping anywhere a finder sits.
    var positions = alignmentPositions(version);
    positions.forEach(function (ar) {
      positions.forEach(function (ac) {
        if (isFinderArea(ar, ac, size)) return;
        for (var y = -2; y <= 2; y++) {
          for (var x = -2; x <= 2; x++) mark(ar + y, ac + x);
        }
      });
    });

    // Format information, both copies, and the fixed dark module.
    for (var f = 0; f < 9; f++) {
      mark(8, f);
      mark(f, 8);
    }
    for (var g = 0; g < 8; g++) {
      mark(8, size - 1 - g);
      mark(size - 1 - g, 8);
    }
  }

  function isReserved(row, col) {
    return reservedRow[row][col] || reservedCol[col][row];
  }

  /* The eight data masks. They are applied only to data modules, so the
     function patterns drawn afterwards are never disturbed by one. */
  var MASKS = [
    function (r, c) {
      return (r + c) % 2 === 0 ? 1 : 0;
    },
    function (r) {
      return r % 2 === 0 ? 1 : 0;
    },
    function (r, c) {
      return c % 3 === 0 ? 1 : 0;
    },
    function (r, c) {
      return (r + c) % 3 === 0 ? 1 : 0;
    },
    function (r, c) {
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0 ? 1 : 0;
    },
    function (r, c) {
      return ((r * c) % 2) + ((r * c) % 3) === 0 ? 1 : 0;
    },
    function (r, c) {
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0 ? 1 : 0;
    },
    function (r, c) {
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0 ? 1 : 0;
    },
  ];

  /**
   * Walk the two-module-wide columns from the right, zig-zagging upward then
   * downward, skipping column 6 and every reserved module, placing one data
   * bit at a time through the chosen mask.
   */
  function placeData(size, codewords, maskId) {
    var grid = emptyGrid(size);
    var bits = [];
    codewords.forEach(function (cw) {
      for (var i = 7; i >= 0; i--) bits.push((cw >>> i) & 1);
    });
    var at = 0;
    var upward = true;
    var mask = MASKS[maskId];

    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // the timing column is never part of a pair
      for (var step = 0; step < size; step++) {
        var row = upward ? size - 1 - step : step;
        for (var k = 0; k < 2; k++) {
          var col = right - k;
          if (col < 0 || col === 6) continue;
          if (isReserved(row, col)) continue;
          var bit = at < bits.length ? bits[at] : 0;
          at += 1;
          grid[row][col] = bit ^ mask(row, col);
        }
      }
      upward = !upward;
    }
    return grid;
  }

  /** Finders, separators, timing, alignment and the fixed dark module. */
  function drawFunctionPatterns(grid, version, size) {
    var corners = [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ];
    corners.forEach(function (c) {
      for (var y = 0; y <= 6; y++) {
        for (var x = 0; x <= 6; x++) {
          var edge = y === 0 || y === 6 || x === 0 || x === 6;
          var core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
          grid[c[0] + y][c[1] + x] = edge || core ? 1 : 0;
        }
      }
    });

    for (var i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0 ? 1 : 0;
      grid[i][6] = i % 2 === 0 ? 1 : 0;
    }

    var positions = alignmentPositions(version);
    positions.forEach(function (ar) {
      positions.forEach(function (ac) {
        if (isFinderArea(ar, ac, size)) return;
        for (var y = -2; y <= 2; y++) {
          for (var x = -2; x <= 2; x++) {
            var edge = Math.abs(y) === 2 || Math.abs(x) === 2;
            var centre = y === 0 && x === 0;
            grid[ar + y][ac + x] = edge || centre ? 1 : 0;
          }
        }
      });
    });

    grid[size - 8][8] = 1;
  }

  /**
   * Fifteen bits of BCH format information holding the level and the mask.
   * Both copies are written, and that duplication is why a code with a
   * scuffed corner still reads.
   */
  function formatBits(maskId) {
    var data = (0x01 << 3) | maskId; // level L is 01
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    var value = ((data << 10) | (rem & 0x3ff)) ^ 0x5412;
    var bits = [];
    for (var b = 14; b >= 0; b--) bits.push((value >>> b) & 1);
    return bits;
  }

  function writeFormatInfo(grid, maskId, size) {
    var bits = formatBits(maskId);
    var i;
    // Copy one, around the top left finder.
    for (i = 0; i <= 5; i++) grid[8][i] = bits[i];
    grid[8][7] = bits[6];
    grid[8][8] = bits[7];
    grid[7][8] = bits[8];
    for (i = 9; i < 15; i++) grid[14 - i][8] = bits[i];
    // Copy two, split between the other two corners.
    for (i = 0; i < 8; i++) grid[size - 1 - i][8] = bits[i];
    for (i = 8; i < 15; i++) grid[8][size - 15 + i] = bits[i];
    // The dark module carries no data, ever.
    grid[size - 8][8] = 1;
  }

  /* Penalty rules, used to pick the best of the eight masks: runs of five or
     more, solid two by two blocks, finder-like sequences, and how far the
     dark to light balance sits from halfway. */
  function penalty(grid) {
    var size = grid.length;
    var score = 0;
    var dark = 0;
    var r;
    var c;

    for (r = 0; r < size; r++) {
      for (c = 0; c < size; c++) if (grid[r][c]) dark += 1;
      score += runPenalty(grid[r]);
    }

    for (c = 0; c < size; c++) {
      var column = [];
      for (r = 0; r < size; r++) column.push(grid[r][c]);
      score += runPenalty(column);
    }

    for (r = 0; r < size - 1; r++) {
      for (c = 0; c < size - 1; c++) {
        var v = grid[r][c];
        if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) {
          score += 3;
        }
      }
    }

    // A finder-like row of dark light dark dark dark light dark with four
    // light modules beside it reads as a third corner to a scanner.
    var pattern = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var anti = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    var lines = [];
    for (r = 0; r < size; r++) {
      lines.push(grid[r]);
      var col = [];
      for (c = 0; c < size; c++) col.push(grid[c][r]);
      lines.push(col);
    }
    lines.forEach(function (line) {
      for (var i = 0; i <= line.length - 11; i++) {
        var slice = line.slice(i, i + 11);
        if (same(slice, pattern) || same(slice, anti)) score += 40;
      }
    });

    var percent = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(percent - 50) / 5) * 10;
    return score;
  }

  function same(a, b) {
    for (var i = 0; i < b.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function runPenalty(line) {
    var score = 0;
    var run = 1;
    for (var i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) {
        run += 1;
      } else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
    return score;
  }

  /**
   * The finished matrix for a string, or null when it will not fit. The size
   * returned is the module count without the quiet zone, which the drawing
   * step adds.
   */
  function matrix(text) {
    var bytes = toBytes(text);
    var version = pickVersion(bytes.length);
    if (!version) return null;

    var codewords = buildCodewords(text, version);
    var size = version * 4 + 17;
    var best = null;
    var bestScore = Infinity;
    var bestMask = 0;

    for (var maskId = 0; maskId < 8; maskId++) {
      reserve(size, version);
      var grid = placeData(size, codewords, maskId);
      drawFunctionPatterns(grid, version, size);
      writeFormatInfo(grid, maskId, size);
      var score = penalty(grid);
      if (score < bestScore) {
        bestScore = score;
        bestMask = maskId;
        best = grid;
      }
    }
    return { grid: best, version: version, size: size, mask: bestMask };
  }

  /**
   * Draw onto a canvas, returning the module size used, or 0 when there was
   * nothing to draw. The quiet zone of four modules is included, because the
   * standard requires it and some cameras refuse a code without it.
   */
  function draw(canvas, text, options) {
    options = options || {};
    var built = matrix(text);
    if (!built) return 0;
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return 0;

    var quiet = 4;
    var total = built.size + quiet * 2;
    // pixelSize is the on-screen side length wanted. The canvas is drawn at a
    // whole number of pixels per module so no module is ever split across a
    // pixel edge, which is what turns a crisp code into mush.
    var wanted = options.pixelSize || total * 6;
    var scale = Math.max(1, Math.floor(wanted / total));
    var side = total * scale;

    canvas.width = side;
    canvas.height = side;
    // The element itself is the exact pixel side, so the drawing is never
    // stretched by the layout. A print caller may pass cssSize to cap it.
    var cssSide = options.cssSize ? Math.min(side, Math.round(options.cssSize)) : side;
    canvas.style.width = cssSide + "px";
    canvas.style.height = cssSide + "px";
    canvas.setAttribute("width", String(side));
    canvas.setAttribute("height", String(side));

    // Ink on white, always. A dark plate behind the code inverts it and no
    // scanner would read it, so the light square goes down first.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, side, side);
    ctx.fillStyle = "#000000";
    for (var r = 0; r < built.size; r++) {
      for (var c = 0; c < built.size; c++) {
        if (!built.grid[r][c]) continue;
        ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      }
    }
    return scale;
  }

  /**
   * An accessible stand-in for the picture, so a person using a screen reader
   * still has the reference in front of them rather than an unlabelled box.
   */
  function describe(text) {
    return (
      "A QR code holding the plan reference " +
      String(text || "") +
      ". Scanning it shows those same characters and nothing more. The reference is also printed in letters on the card."
    );
  }

  window.MLMP_QR = {
    matrix: matrix,
    draw: draw,
    describe: describe,
    toBytes: toBytes,
    formatBits: formatBits,
    pickVersion: pickVersion,
    dataCodeWords: DATA_CODEWORDS,
    totalCodeWords: TOTAL_CODEWORDS,
    maxLength: function () {
      return DATA_CODEWORDS[MAX_VERSION - 1] - 3;
    },
  };
})();
