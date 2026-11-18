#!/usr/bin/env python3
"""Draw Forge's icon (a dot over a horizon line, white on black) as PNGs.

Pure standard library, no Pillow needed. Run from anywhere:
    python3 scripts/make_icons.py
"""
import math
import pathlib
import struct
import zlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "icons"
SIZES = (16, 32, 48, 128)
SS = 8  # supersampling per axis


def in_round_rect(x, y, r=0.22):
    cx = min(max(x, r), 1 - r)
    cy = min(max(y, r), 1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def is_white(x, y):
    # the horizon
    if 0.2 <= x <= 0.8 and 0.62 <= y <= 0.705:
        return True
    # the dot above it
    return (x - 0.5) ** 2 + (y - 0.4) ** 2 <= 0.115 ** 2


def render(size):
    px = bytearray()
    for j in range(size):
        px.append(0)  # PNG filter: none
        for i in range(size):
            inside = white = 0
            for sj in range(SS):
                for si in range(SS):
                    x = (i + (si + 0.5) / SS) / size
                    y = (j + (sj + 0.5) / SS) / size
                    if in_round_rect(x, y):
                        inside += 1
                        if is_white(x, y):
                            white += 1
            n = SS * SS
            alpha = round(255 * inside / n)
            v = round(255 * white / inside) if inside else 0
            px += bytes((v, v, v, alpha))
    return bytes(px)


def png(size, raw):
    def chunk(kind, data):
        c = struct.pack(">I", len(data)) + kind + data
        return c + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for s in SIZES:
        path = OUT / f"icon{s}.png"
        path.write_bytes(png(s, render(s)))
        print("wrote", path.relative_to(OUT.parent.parent))


if __name__ == "__main__":
    main()
