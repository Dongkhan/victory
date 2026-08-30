#!/usr/bin/env python3
"""러닝퀘스트 Android 런처 아이콘·스플래시 생성기.

외부 에셋 없이 앱의 '경로(route)' 비주얼을 그대로 그려 아이콘을 만든다.
사용법:  python3 tools/make_icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

RES = Path(__file__).resolve().parents[1] / "android/app/src/main/res"

TEAL = (13, 148, 136)
LIME = (132, 204, 22)
CORAL = (251, 113, 133)
INK = (11, 18, 32)

LAUNCHER = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
FOREGROUND = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
SS = 4  # 슈퍼샘플링 배율


def bezier(p0, p1, p2, p3, steps=90):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        pts.append((x, y))
    return pts


def route(box, inset):
    """정규화 좌표의 러닝 경로 → 박스 안쪽 inset 비율만큼 여백을 둔 픽셀 좌표."""
    norm = (bezier((0.12, 0.80), (0.32, 0.79), (0.20, 0.50), (0.46, 0.46), 220)
            + bezier((0.46, 0.46), (0.72, 0.42), (0.60, 0.21), (0.87, 0.17), 220))
    span = box * (1 - 2 * inset)
    off = box * inset
    return [(off + x * span, off + y * span) for x, y in norm]


def gradient(size, a, b):
    img = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(size - 1, 1)
        d.line([(0, y), (size, y)], fill=tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    return img


def draw_route(img, box, inset=0.10):
    """원을 촘촘히 찍어 이음매 없는 둥근 획을 만든다(PIL line joint 아티팩트 회피)."""
    d = ImageDraw.Draw(img)
    pts = route(box, inset)
    r = box * (1 - 2 * inset) * 0.043
    for x, y in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255))
    for point, fill in ((pts[0], (255, 255, 255)), (pts[-1], CORAL)):
        rr = box * (1 - 2 * inset) * 0.085
        d.ellipse([point[0]-rr, point[1]-rr, point[0]+rr, point[1]+rr], fill=fill,
                  outline=(255, 255, 255), width=max(1, round(box * 0.02)))
    return img


def launcher(size, round_icon=False):
    box = size * SS
    img = gradient(box, TEAL, LIME).convert("RGBA")
    draw_route(img, box)
    if round_icon:
        mask = Image.new("L", (box, box), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, box - 1, box - 1], fill=255)
        img.putalpha(mask)
    else:  # 살짝 둥근 사각형
        mask = Image.new("L", (box, box), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, box - 1, box - 1], radius=box * 0.22, fill=255)
        img.putalpha(mask)
    return img.resize((size, size), Image.LANCZOS)


def foreground(size):
    """적응형 아이콘 전경: 안전 영역(가운데 66%) 안에만 마크를 둔다."""
    box = size * SS
    img = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    draw_route(img, box, inset=0.20)
    return img.resize((size, size), Image.LANCZOS)


def splash(w, h):
    img = Image.new("RGB", (w, h), INK)
    mark_box = int(min(w, h) * 0.42)
    mark = Image.new("RGBA", (mark_box * SS, mark_box * SS), (0, 0, 0, 0))
    draw_route(mark, mark_box * SS, inset=0.06)
    mark = mark.resize((mark_box, mark_box), Image.LANCZOS)
    img.paste(mark, ((w - mark_box) // 2, (h - mark_box) // 2), mark)
    return img


def main():
    for dpi, size in LAUNCHER.items():
        out = RES / ("mipmap-" + dpi)
        out.mkdir(parents=True, exist_ok=True)
        launcher(size).save(out / "ic_launcher.png")
        launcher(size, round_icon=True).save(out / "ic_launcher_round.png")
        foreground(FOREGROUND[dpi]).save(out / "ic_launcher_foreground.png")
        print("icon", dpi, size)

    for path in sorted(RES.glob("drawable*/splash.png")):
        with Image.open(path) as cur:
            w, h = cur.size
        splash(w, h).save(path)
        print("splash", path.parent.name, w, h)


if __name__ == "__main__":
    main()
