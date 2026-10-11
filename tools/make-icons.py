#!/usr/bin/env python3
"""Draw the app icons and write them as PNG files.

The mark is deliberately plain: a rounded green square with a cream leaf and
dark veins. It matches icons/icon.svg, and it avoids gradients, which the
interface also avoids.

No image library is available here, so the PNG is written by hand and the
shapes are rasterised with a small amount of plane geometry. Run from the
repository root:

    python3 tools/make-icons.py             write the icons
    python3 tools/make-icons.py --preview   print an ASCII preview first

Outputs, all committed so no build step is ever needed:
    icons/icon-192.png, icons/icon-512.png
    icons/icon-maskable-192.png, icons/icon-maskable-512.png
"""

import math
import os
import struct
import sys
import zlib

# Palette, taken from css/styles.css so the icon matches the interface.
ACCENT = (0x3D, 0x5A, 0x3D)
CREAM = (0xF7, 0xF5, 0xF0)

CANVAS = 512
SUPERSAMPLE = 4

# The leaf outline, in canvas coordinates. Two cubic edges meet at a top and a
# bottom tip, which is what gives a leaf its pointed oval shape. The shape is
# symmetric about x = 256 by construction.
TIP_TOP = (256.0, 88.0)
TIP_BOTTOM = (256.0, 424.0)
BULGE = 118.0
CTRL_TOP = (TIP_TOP[0] + BULGE, TIP_TOP[1] + 112.0)
CTRL_BOTTOM = (TIP_TOP[0] + BULGE, TIP_BOTTOM[1] - 112.0)

MIDRIB_WIDTH = 7.0
VEIN_WIDTH = 5.0
VEIN_LEVELS = (172.0, 222.0, 272.0, 322.0)

CENTER = CANVAS / 2.0


# ---------------------------------------------------------------- PNG output


def write_png(path, width, height, pixels):
    """Write 8-bit RGBA pixels (a flat bytearray) as a PNG."""
    stride = width * 4
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0, none
        raw += pixels[y * stride:(y + 1) * stride]

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        out += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        return out

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as handle:
        handle.write(png)


# ----------------------------------------------------------------- Geometry


def cubic(p0, p1, p2, p3, t):
    u = 1.0 - t
    return (
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    )


def build_leaf_span():
    """Half width of the leaf for every integer y. -1.0 outside the leaf."""
    span = [-1.0] * (CANVAS + 1)
    samples = []
    for i in range(2001):
        samples.append(cubic(TIP_TOP, CTRL_TOP, CTRL_BOTTOM, TIP_BOTTOM, i / 2000.0))
    for y in range(int(TIP_TOP[1]), int(TIP_BOTTOM[1]) + 1):
        # Nearest sampled point on the right-hand edge at this height.
        best = None
        for (x, sy) in samples:
            d = abs(sy - y)
            if best is None or d < best[0]:
                best = (d, x)
        span[y] = best[1] - CENTER
    return span


LEAF_SPAN = build_leaf_span()
LEAF_TOP = int(math.floor(TIP_TOP[1]))
LEAF_BOTTOM = int(math.ceil(TIP_BOTTOM[1]))


def in_leaf(x, y):
    """True when a canvas-space point is inside the leaf."""
    if y < LEAF_TOP or y > LEAF_BOTTOM:
        return False
    half = LEAF_SPAN[int(round(y))]
    if half < 0:
        return False
    return abs(x - CENTER) <= half


def vein_segments():
    """The midrib and the side veins, as capsules in canvas coordinates."""
    segments = [((CENTER, 118.0), (CENTER, 402.0), MIDRIB_WIDTH)]
    for level in VEIN_LEVELS:
        half = LEAF_SPAN[int(round(level))]
        if half < 0:
            continue
        end = half - 16.0
        segments.append(((CENTER, level), (CENTER + end, level), VEIN_WIDTH))
        segments.append(((CENTER, level), (CENTER - end, level), VEIN_WIDTH))
    return segments


VEINS = vein_segments()


def in_rounded_rect(x, y, left, top, size, radius):
    right, bottom = left + size, top + size
    if x < left or x > right or y < top or y > bottom:
        return False
    if radius <= 0:
        return True
    cx = min(max(x, left + radius), right - radius)
    cy = min(max(y, top + radius), bottom - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius


def in_capsule(x, y, a, b, radius):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    length2 = dx * dx + dy * dy
    t = 0.0 if length2 == 0 else max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / length2))
    px, py = ax + t * dx, ay + t * dy
    return (x - px) ** 2 + (y - py) ** 2 <= radius * radius


# ------------------------------------------------------------------- Drawing


def compose_icon(size, maskable):
    """Return the RGBA pixel buffer for one icon."""
    scale = size / CANVAS

    # A maskable icon is cropped by the launcher, so the background runs to the
    # edges and the art shrinks into the safe zone.
    if maskable:
        art_scale = 0.60
        bg_left, bg_top, bg_size, bg_radius = 0.0, 0.0, float(CANVAS), 0.0
    else:
        art_scale = 1.0
        bg_left, bg_top, bg_size, bg_radius = 24.0, 24.0, 464.0, 104.0

    inv_art = 1.0 / art_scale
    pixels = bytearray(size * size * 4)
    step = 1.0 / SUPERSAMPLE
    samples = SUPERSAMPLE * SUPERSAMPLE

    for py in range(size):
        for px in range(size):
            bg_hits = 0
            leaf_hits = 0
            vein_hits = 0
            for sy in range(SUPERSAMPLE):
                cy = (py + (sy + 0.5) * step) / scale
                for sx in range(SUPERSAMPLE):
                    cx = (px + (sx + 0.5) * step) / scale
                    if not in_rounded_rect(cx, cy, bg_left, bg_top, bg_size, bg_radius):
                        continue
                    bg_hits += 1
                    if art_scale != 1.0:
                        ax = CENTER + (cx - CENTER) * inv_art
                        ay = CENTER + (cy - CENTER) * inv_art
                    else:
                        ax, ay = cx, cy
                    if not in_leaf(ax, ay):
                        continue
                    leaf_hits += 1
                    for (a, b, radius) in VEINS:
                        if in_capsule(ax, ay, a, b, radius):
                            vein_hits += 1
                            break

            if bg_hits == 0:
                rgba = (0, 0, 0, 0)
            else:
                mix_leaf = leaf_hits / bg_hits
                colour = [ACCENT[i] + (CREAM[i] - ACCENT[i]) * mix_leaf for i in range(3)]
                mix_vein = vein_hits / bg_hits
                colour = [colour[i] + (ACCENT[i] - colour[i]) * mix_vein for i in range(3)]
                rgba = (
                    int(round(colour[0])),
                    int(round(colour[1])),
                    int(round(colour[2])),
                    int(round(bg_hits / samples * 255)),
                )

            offset = (py * size + px) * 4
            pixels[offset:offset + 4] = bytes(rgba)

    return pixels


def preview(size=48):
    """Print the mark as ASCII so the shape can be eyeballed."""
    pixels = compose_icon(size, False)
    rows = []
    for y in range(size):
        row = ""
        for x in range(size):
            o = (y * size + x) * 4
            if pixels[o + 3] < 100:
                row += " "
                continue
            r, g, b = pixels[o], pixels[o + 1], pixels[o + 2]
            if abs(r - ACCENT[0]) < 24 and abs(g - ACCENT[1]) < 24:
                row += "#"      # accent green
            elif r > 230 and g > 230:
                row += "."      # cream leaf
            else:
                row += "+"      # edge blend
        rows.append(row)
    return "\n".join(rows)


def main():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if "--preview" in sys.argv:
        print(preview())
        return

    icons_dir = os.path.join(here, "icons")
    os.makedirs(icons_dir, exist_ok=True)

    targets = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-192.png", 192, True),
        ("icon-maskable-512.png", 512, True),
    ]
    for name, size, maskable in targets:
        path = os.path.join(icons_dir, name)
        write_png(path, size, size, compose_icon(size, maskable))
        print("wrote %s (%d bytes)" % (os.path.relpath(path, here), os.path.getsize(path)))


if __name__ == "__main__":
    main()
