#!/usr/bin/env python3
# Draws the favicon: a bright cyan square with its top-right corner cut off (the page's bevel),
# as SVG, ICO (16, 32, 48) and a 180 px PNG for Apple devices. Output: assets/favicon/.
#   python3 tools/make-favicon.py
from pathlib import Path
from PIL import Image, ImageDraw
CYAN = (0, 228, 253, 255)
out = Path(__file__).resolve().parent.parent / "assets" / "favicon"
out.mkdir(parents=True, exist_ok=True)
(out / "favicon.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M2 2h20l8 8v20H2z" fill="#00e4fd"/></svg>\n')
def draw(size, pad):
    s = 8 * size                      # draw large, then shrink: smooth edges
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    p, cut = pad * 8, s * 8 // 32
    ImageDraw.Draw(im).polygon([(p, p), (s - p - cut, p), (s - p, p + cut), (s - p, s - p), (p, s - p)], fill=CYAN)
    return im.resize((size, size), Image.LANCZOS)
draw(48, 1).save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
draw(180, 0).save(out / "apple-touch-icon.png")
print("wrote", ", ".join(sorted(p.name for p in out.iterdir())))
