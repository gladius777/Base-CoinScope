#!/usr/bin/env python3
"""Make black background transparent in CoinScope logo."""

from pathlib import Path

from PIL import Image

LOGO = Path(__file__).resolve().parent.parent / "public" / "coinscope-logo.png"
THRESHOLD = 25  # R,G,B all <= this -> transparent


def main() -> None:
    img = Image.open(LOGO).convert("RGBA")
    data = img.getdata()
    out = []
    for r, g, b, a in data:
        if r <= THRESHOLD and g <= THRESHOLD and b <= THRESHOLD:
            out.append((0, 0, 0, 0))
        else:
            out.append((r, g, b, a))
    img.putdata(out)
    img.save(LOGO, "PNG")
    print("Logo background set to transparent:", LOGO)


if __name__ == "__main__":
    main()
