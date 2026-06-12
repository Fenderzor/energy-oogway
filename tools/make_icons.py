"""Generate Energy Oogway PWA icons: a turtle-shell motif with an energy bolt.

Outputs PNGs into app/public/icons/ plus apple-touch-icon and favicon.
Run: python tools/make_icons.py
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "app", "public")
ICONS = os.path.join(PUBLIC, "icons")
os.makedirs(ICONS, exist_ok=True)

# Palette
G_TOP = (21, 127, 93)     # gradient top (green)
G_BOT = (10, 59, 44)      # gradient bottom (deep green)
SHELL = (31, 158, 111)    # shell fill
LINE = (8, 46, 35)        # shell outline / segments (dark)
BOLT = (255, 210, 63)     # energy bolt (amber)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size, top, bottom):
    img = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp(top, bottom, y / (size - 1)))
    return img


def hexagon(cx, cy, r, rot_deg=30):
    pts = []
    for i in range(6):
        a = math.radians(60 * i + rot_deg)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def draw_shell(d, cx, cy, R, s):
    line_w = max(1, int(s * 0.013))
    # Dome
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=SHELL, outline=LINE, width=line_w)
    # Central flat-top hexagon
    r0 = R * 0.46
    hp = hexagon(cx, cy, r0, 30)
    for i in range(6):
        d.line([hp[i], hp[(i + 1) % 6]], fill=LINE, width=line_w)
    # Radial segments out to the rim
    for (vx, vy) in hp:
        a = math.atan2(vy - cy, vx - cx)
        ox = cx + math.cos(a) * R * 0.97
        oy = cy + math.sin(a) * R * 0.97
        d.line([(vx, vy), (ox, oy)], fill=LINE, width=line_w)
    # Energy bolt inside the central hexagon
    bsize = r0 * 1.45
    bolt = [(0.05, -0.5), (-0.28, 0.08), (-0.03, 0.08),
            (-0.13, 0.5), (0.30, -0.12), (0.04, -0.12)]
    pts = [(cx + x * bsize, cy + y * bsize) for (x, y) in bolt]
    d.polygon(pts, fill=BOLT)


def make_icon(size, maskable=False, rounded=True):
    SS = 4
    s = size * SS
    img = gradient(s, G_TOP, G_BOT)
    d = ImageDraw.Draw(img)
    cx = cy = s / 2
    R = s * (0.30 if maskable else 0.36)
    draw_shell(d, cx, cy, R, s)
    img = img.resize((size, size), Image.LANCZOS).convert("RGBA")
    if maskable or not rounded:
        return img
    radius = int(size * 0.22)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def main():
    make_icon(192).save(os.path.join(ICONS, "icon-192.png"))
    make_icon(512).save(os.path.join(ICONS, "icon-512.png"))
    make_icon(512, maskable=True).save(os.path.join(ICONS, "icon-512-maskable.png"))
    # Apple touch icon: full square (iOS masks corners itself)
    make_icon(180, rounded=False).save(os.path.join(PUBLIC, "apple-touch-icon.png"))
    make_icon(32).save(os.path.join(PUBLIC, "favicon-32.png"))
    print("Icons written to", ICONS)


if __name__ == "__main__":
    main()
