#!/usr/bin/env python3
"""README visuals for dsh-site-log-check, read off the shipped pipeline.

Every number, rule id and label below comes from the repository itself:

  * `src/parse.ts` / `src/model.ts`  -> the material surfaces: project.serviceStart /
    serviceEnd, logs[], keyWorks[], onsite[] and their fields.
  * `src/check.ts`                   -> the eleven checker functions and the 14 rules,
    including SL-001/SL-002 (calendar continuity), SL-003…SL-007 (log columns),
    SL-008/SL-012 (declared key works and their on-site coverage),
    SL-009…SL-011/SL-014 (the on-site record) and SL-013 (log claim vs record date).
  * `src/shared/report.ts` / `src/view.ts` -> issues[] and skipped[] are two mandatory
    channels, and each issue carries locator / found / expected / fix / basis.
  * `samples/quickstart/expected/result.json` -> the one run quoted by the figures:
    5 issues (0 error, 1 warn, 4 info) and 12 skipped.  The 12 skipped are exactly
    7 checks that could not run (no keyWorks[], no onsite[], no log claims on-site)
    plus 5 checks that ran with no difference and are still listed by runCheck().

Outputs (idempotent overwrite):

  docs/assets/dsh-site-log-check-hero-{zh,en}-{light,dark}.webp
      1440x576 Pillow banner.  Left column: kicker / package wordmark / slogan /
      two value lines / subtitle / meta / footer.  Right side: the service-period
      day rail (two logs on 2026-03-01, four hollow days), the SL-001 finding card
      with the exact wording `check.ts` emits, and the skipped split (7 cannot run,
      5 ran with no difference).

  docs/assets/dsh-site-log-check-flow-v5-{light,dark}.svg
      1100x660 hand-written SVG.  Grammar: three evidence swimlanes over one
      service-period day ruler, with two cross-lane bridges — SL-012 (keyWorks[]
      to onsite[]) and SL-013 (a log's on-site claim to the same-day record) —
      feeding the two report channels.  Solid marks are present in the quickstart;
      dashed marks are surfaces the sample does not carry, whose gates name
      themselves in skipped[].  This is deliberately not a left-to-right node chain:
      the report is an aggregate of three surfaces, not the next step of one.

The older single-version assets (dsh-site-log-check-flow.svg, -hero.png, -demo.gif,
quickstart.png) stay on disk so external links keep working; the READMEs reference
the new pair instead.

Every label is measured before it is drawn; a label that would overflow aborts the
run instead of shipping clipped text.

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow, Windows fonts msyh.ttc / msyhbd.ttc / consola.ttf.
"""
from __future__ import annotations

import os
from html import escape

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")
NAME = "dsh-site-log-check"

FONT_FILES = {
    "cjk": r"C:\Windows\Fonts\msyh.ttc",
    "cjk_bold": r"C:\Windows\Fonts\msyhbd.ttc",
    "mono": r"C:\Windows\Fonts\consola.ttf",
    "mono_bold": r"C:\Windows\Fonts\consolab.ttf",
}
for _kind, _path in FONT_FILES.items():
    if not os.path.exists(_path):
        raise SystemExit(f"FATAL: font missing: {_path}")
os.makedirs(OUT, exist_ok=True)

RADIUS = 20
SHADOW = 24

SKIN = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8",
        card="#ffffff", edge="#e6e2ef",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", pill="#ece7f9", band="#f5f2fb",
        grid="#e7e4f0", warn="#b45309", warn_bg="#fdf3e9",
        ok="#15803d", ok_bg="#eaf6ee", skip="#8f94a4", skip_bg="#f1eef7",
        shadow=(38, 30, 72), glow=34,
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016",
        card="#1b2231", edge="#2e374b",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", pill="#242d42", band="#202839",
        grid="#262f42", warn="#d9a441", warn_bg="#2a2216",
        ok="#3fb950", ok_bg="#16281c", skip="#737b8d", skip_bg="#222a3b",
        shadow=(0, 0, 0), glow=48,
    ),
}


def font(size: int, kind: str = "cjk") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_FILES[kind], size)


def hx(color: str) -> tuple[int, int, int]:
    color = color.lstrip("#")
    return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w: int, h: int, top: str, bottom: str) -> Image.Image:
    base = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(base)
    a, b = hx(top), hx(bottom)
    for y in range(h):
        t = 0.12 * (y / h) + 0.88 * (y / h) ** 1.3
        draw.line([(0, y), (w, y)],
                  fill=tuple(int(p + (q - p) * t) for p, q in zip(a, b)))
    return base


def glow(img: Image.Image, cx: int, cy: int, r: int, color: str,
         alpha: int) -> Image.Image:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rgb = hx(color)
    for i in range(10, 0, -1):
        rr = r * i / 10
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=rgb + (int(alpha * (1 - i / 11)),))
    return Image.alpha_composite(img.convert("RGBA"),
                                 layer.filter(ImageFilter.GaussianBlur(26))
                                 ).convert("RGB")


def card(img: Image.Image, box: tuple[int, int, int, int], s: dict,
         radius: int = RADIUS, shadow: int = SHADOW,
         fill: str | None = None, edge: str | None = None) -> Image.Image:
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(shadow, 0, -2):
        sd.rounded_rectangle([x0 - i // 6, y0 + i // 2, x1 + i // 6, y1 + i],
                             radius=radius + i // 6,
                             fill=s["shadow"] + (int(10 * (1 - i / shadow)),))
    base = Image.alpha_composite(img.convert("RGBA"),
                                 sh.filter(ImageFilter.GaussianBlur(11)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(fill or s["card"]),
                        outline=hx(edge or s["edge"]), width=2)
    return base.convert("RGB")


_MEASURE = ImageDraw.Draw(Image.new("RGB", (8, 8)))


def measure(text: str, size: int, kind: str) -> float:
    return _MEASURE.textlength(text, font=font(size, kind))


def require_w(text: str, size: int, kind: str, max_w: float, what: str) -> None:
    got = measure(text, size, kind)
    if got > max_w + 0.4:
        raise SystemExit(f"FATAL: {what} overflows: {text!r} needs "
                         f"{got:.1f}px > {max_w:.0f}px")


def fit(text: str, kind: str, max_w: float, start: int, minimum: int) -> int:
    size = start
    while size > minimum:
        if measure(text, size, kind) <= max_w:
            return size
        size -= 1
    raise SystemExit(f"FATAL: text does not fit {max_w}px at >= {minimum}px: "
                     f"{text!r}")


def fit_lines(lines: list[str], kind: str, max_w: float, start: int,
              minimum: int) -> int:
    return min(fit(t, kind, max_w, start, minimum) for t in lines)


def pill(img: Image.Image, xy: tuple[int, int], text: str, s: dict,
         size: int = 16, fg: str | None = None, bg: str | None = None,
         kind: str = "cjk_bold") -> int:
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    w = int(d.textlength(text, font=f))
    x, y = xy
    h = size + 20
    d.rounded_rectangle([x, y, x + w + 30, y + h], radius=h // 2,
                        fill=hx(bg or s["pill"]))
    d.text((x + 15, y + (h - size) / 2 - 1), text, font=f,
           fill=hx(fg or s["accent"]))
    return int(x + w + 30)


def chip_right(img: Image.Image, right: int, y: int, text: str, fg: str,
               bg: str, size: int = 12, height: int = 24,
               kind: str = "cjk_bold") -> int:
    d = ImageDraw.Draw(img)
    w = int(d.textlength(text, font=font(size, kind)) + 20)
    x = right - w
    d.rounded_rectangle([x, y, right, y + height], radius=height / 2,
                        fill=hx(bg))
    d.text((x + 10, y + (height - size) / 2 - 1), text,
           font=font(size, kind), fill=hx(fg))
    return int(x)


def dashed_round_rect(d: ImageDraw.ImageDraw, box: tuple[int, int, int, int],
                      color: str, radius: int = 8, width: int = 2) -> None:
    x0, y0, x1, y1 = box
    for xa, xb in ((x0 + radius, x1 - radius),):
        for yy in (y0, y1):
            for x in range(int(xa), int(xb), 10):
                d.line([(x, yy), (min(x + 6, xb), yy)], fill=hx(color),
                       width=width)
    for y in range(int(y0 + radius), int(y1 - radius), 10):
        for xx in (x0, x1):
            d.line([(xx, y), (xx, min(y + 6, y1 - radius))], fill=hx(color),
                   width=width)
    d.arc([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270,
          fill=hx(color), width=width)
    d.arc([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360,
          fill=hx(color), width=width)
    d.arc([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180,
          fill=hx(color), width=width)
    d.arc([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90,
          fill=hx(color), width=width)


# --------------------------------------------------------------------------- hero
HERO = {
    "zh": dict(
        kicker="DeepSeek Harness · 监理资料核查",
        eyebrow=NAME,
        title="逐日对账",
        value=["同一天写两条，日历日重复；", "缺了哪几天，直接指到日期。"],
        sub="14 条带条款出处的规则 · 只列字面差异",
        meta="site_log_check · rules/site-log-check.yaml",
        foot="Apache-2.0 · 只读材料 · 不联网 · 不调用模型",
        doc_title="监理服务期 · 只读材料",
        doc_meta="2026-03-01 → 2026-03-05 · 5 个日历日",
        chip="JSON / YAML",
        log1=("2026-03-01", "log 1 · 张监理"),
        log2=("2026-03-01", "log 2 · 王监理"),
        missing="缺日",
        missing_sub="无监理日志",
        gate1="SL-001 · warn",
        gate2="SL-002 · info ×4",
        note1="同一天 2 条日志 → 1 条 warn",
        note2="4 个日历日无日志 → 4 条 info",
        finding_title="SL-001 · warn",
        finding_loc="2026-03-01 · 日历日",
        finding_found="2026-03-01 出现 2 条日志",
        finding_expected="同一日历日只应有 1 条监理日志",
        finding_fix="核对是否存在重复归档或补充记录未标注",
        finding_basis="依据 GB/T 50319-2013 第2.0.21条 · 逐字摘录",
        skip_title="skipped[] · 12",
        skip_lines=["7 条：材料缺项，无法执行", "5 条：已执行，无差异"],
        skip_note="空 issues ≠ 没问题",
        strip=[("0 error", "faint"), ("1 warn", "warn"),
               ("4 info", "accent"), ("12 skipped", "faint")],
        strip_right="结论留给审核人",
    ),
    "en": dict(
        kicker="DeepSeek Harness · supervision log checker",
        eyebrow=NAME,
        title="Day by day.",
        value=["Two logs, one day: flagged.", "Four gaps: every date named."],
        sub="14 cited rules · literal differences",
        meta="site_log_check · rules/site-log-check.yaml",
        foot="Apache-2.0 · read-only · no network · no model call",
        doc_title="Supervision period · read-only",
        doc_meta="2026-03-01 → 2026-03-05 · 5 calendar days",
        chip="JSON / YAML",
        log1=("2026-03-01", "Zhang"),
        log2=("2026-03-01", "Wang"),
        missing="no log",
        missing_sub="calendar gap",
        gate1="SL-001 · warn",
        gate2="SL-002 · info ×4",
        note1="two logs on one day → 1 warn",
        note2="four calendar days without a log → 4 info",
        finding_title="SL-001 · warn",
        finding_loc="2026-03-01 · calendar day",
        finding_found="2 logs dated 2026-03-01",
        finding_expected="one log per calendar day",
        finding_fix="check duplicate filing or an unmarked re-entry",
        finding_basis="basis GB/T 50319-2013 2.0.21 · verbatim",
        skip_title="skipped[] · 12",
        skip_lines=["7 · material missing, cannot run", "5 · ran, no difference"],
        skip_note="empty issues ≠ all clear",
        strip=[("0 error", "faint"), ("1 warn", "warn"),
               ("4 info", "accent"), ("12 skipped", "faint")],
        strip_right="the reviewer decides",
    ),
}


def hero(lang: str, skin: str) -> None:
    s = SKIN[skin]
    h = HERO[lang]
    W, H = 1440, 576
    img = gradient(W, H, s["bg_from"], s["bg_to"])
    img = glow(img, 1180, 80, 420, s["accent"], s["glow"])
    img = glow(img, 230, 600, 300, s["accent"], max(8, s["glow"] // 3))
    d = ImageDraw.Draw(img)
    m = 64
    col_w = 540

    # ---- left column --------------------------------------------------------
    pill(img, (m, 76), h["kicker"], s, size=17)
    d = ImageDraw.Draw(img)

    require_w(h["eyebrow"], 26, "mono", col_w, "hero wordmark")
    d.text((m, 126), h["eyebrow"], font=font(26, "mono"),
           fill=hx(s["accent"]))

    title_size = fit(h["title"], "cjk_bold" if lang == "zh" else "mono_bold",
                     col_w, 84, 80)
    require_w(h["title"], title_size,
              "cjk_bold" if lang == "zh" else "mono_bold", col_w, "hero title")
    d.text((m, 166), h["title"],
           font=font(title_size,
                     "cjk_bold" if lang == "zh" else "mono_bold"),
           fill=hx(s["text"]))

    value_kind = "cjk_bold" if lang == "zh" else "cjk_bold"
    value_size = fit_lines(h["value"], value_kind, col_w, 34, 30)
    for i, line in enumerate(h["value"]):
        require_w(line, value_size, value_kind, col_w, "hero value line")
        d.text((m, 290 + i * 48), line, font=font(value_size, value_kind),
               fill=hx(s["text"]))

    require_w(h["sub"], 25, "cjk", col_w, "hero subtitle")
    d.text((m, 394), h["sub"], font=font(25, "cjk"), fill=hx(s["sub"]))

    require_w(h["meta"], 20, "cjk", col_w, "hero meta")
    d.text((m, 434), h["meta"], font=font(20, "cjk"), fill=hx(s["faint"]))

    d.line([m, 474, m + col_w - 8, 474], fill=hx(s["grid"]), width=2)
    require_w(h["foot"], 16, "cjk", col_w, "hero footer")
    d.text((m, 490), h["foot"], font=font(16, "cjk"), fill=hx(s["faint"]))

    # ---- ① service-period day rail -----------------------------------------
    img = card(img, (628, 56, 1376, 340), s, radius=20, shadow=26)
    d = ImageDraw.Draw(img)
    d.text((652, 76), h["doc_title"], font=font(17, "cjk_bold"),
           fill=hx(s["text"]))
    require_w(h["doc_title"], 17, "cjk_bold", 430, "hero rail title")
    chip_right(img, 1352, 70, h["chip"], s["accent"], s["pill"], size=11)
    d = ImageDraw.Draw(img)
    require_w(h["doc_meta"], 12, "cjk", 520, "hero rail meta")
    d.text((652, 102), h["doc_meta"], font=font(12, "cjk"),
           fill=hx(s["sub"]))

    day_x0, day_w, day_n = 652, 140, 5
    for i in range(day_n):
        cx = day_x0 + day_w * i + day_w / 2
        d.text((cx, 138), f"03-0{i + 1}", font=font(13, "mono_bold"),
               fill=hx(s["sub"]), anchor="ma")
    d.line([652, 160, 1352, 160], fill=hx(s["grid"]), width=2)

    # column 1: two logs on the same calendar day, stacked
    for i, (date, who) in enumerate((h["log1"], h["log2"])):
        x = 652 + i * 12
        y = 166 + i * 46
        d.rounded_rectangle([x, y, x + 128, y + 42], radius=12,
                            fill=hx(s["warn_bg"]),
                            outline=hx(s["warn"]), width=2)
        d.text((x + 12, y + 6), date, font=font(13, "mono_bold"),
               fill=hx(s["warn"]))
        d.text((x + 12, y + 24), who, font=font(11.5, "cjk"),
               fill=hx(s["sub"]))
        require_w(date, 13, "mono_bold", 104, "hero log date")
        require_w(who, 11.5, "cjk", 104, "hero log recorder")

    # columns 2..5: hollow days
    for i in range(1, day_n):
        x = day_x0 + day_w * i
        box = (x, 172, x + 128, 234)
        d.rounded_rectangle(box, radius=12, fill=hx(s["skip_bg"]))
        dashed_round_rect(d, box, s["skip"], radius=12, width=2)
        d.text((x + 64, 187), h["missing"], font=font(13, "cjk_bold"),
               fill=hx(s["skip"]), anchor="ma")
        d.text((x + 64, 209), h["missing_sub"], font=font(11, "cjk"),
               fill=hx(s["faint"]), anchor="ma")
        require_w(h["missing"], 13, "cjk_bold", 112, "hero missing label")
        require_w(h["missing_sub"], 11, "cjk", 112, "hero missing sub")

    # gates
    y = 258
    for text, fg, bg, x in ((h["gate1"], s["warn"], s["warn_bg"], 652),
                            (h["gate2"], s["accent"], s["pill"], 892)):
        w = int(measure(text, 12.5, "cjk_bold") + 24)
        d.rounded_rectangle([x, y, x + w, y + 26], radius=13,
                            fill=hx(bg), outline=hx(fg), width=2)
        d.text((x + 12, y + 4), text, font=font(12.5, "cjk_bold"),
               fill=hx(fg))
        require_w(text, 12.5, "cjk_bold", 210, "hero gate chip")

    require_w(h["note1"], 12.5, "cjk", 690, "hero rail note 1")
    require_w(h["note2"], 12.5, "cjk", 690, "hero rail note 2")
    d.text((652, 294), h["note1"], font=font(12.5, "cjk"), fill=hx(s["warn"]))
    d.text((652, 315), h["note2"], font=font(12.5, "cjk"), fill=hx(s["accent"]))

    # ---- ② finding card -----------------------------------------------------
    img = card(img, (628, 356, 1044, 500), s, radius=18, shadow=20)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([640, 368, 644, 488], radius=2, fill=hx(s["warn"]))
    d.text((660, 370), h["finding_title"], font=font(14, "cjk_bold"),
           fill=hx(s["warn"]))
    d.text((1020, 372), h["finding_loc"], font=font(11.5, "cjk"),
           fill=hx(s["faint"]), anchor="ra")
    require_w(h["finding_title"], 14, "cjk_bold", 150, "hero finding title")
    require_w(h["finding_loc"], 11.5, "cjk", 180, "hero finding locator")
    require_w(h["finding_found"], 13, "cjk", 360, "hero finding found")
    require_w(h["finding_expected"], 12, "cjk", 360, "hero finding expected")
    require_w(h["finding_fix"], 11.5, "cjk", 360, "hero finding fix")
    require_w(h["finding_basis"], 11, "cjk", 360, "hero finding basis")
    d.text((660, 396), h["finding_found"], font=font(13, "cjk"),
           fill=hx(s["text"]))
    d.text((660, 420), h["finding_expected"], font=font(12, "cjk"),
           fill=hx(s["sub"]))
    d.text((660, 442), h["finding_fix"], font=font(11.5, "cjk"),
           fill=hx(s["sub"]))
    d.text((660, 466), h["finding_basis"], font=font(11, "cjk"),
           fill=hx(s["faint"]))

    # ---- ③ skipped card -----------------------------------------------------
    img = card(img, (1060, 356, 1376, 500), s, radius=18, shadow=20)
    d = ImageDraw.Draw(img)
    d.text((1084, 370), h["skip_title"], font=font(14, "cjk_bold"),
           fill=hx(s["text"]))
    require_w(h["skip_title"], 14, "cjk_bold", 150, "hero skip title")
    for i, line in enumerate(h["skip_lines"]):
        require_w(line, 12, "cjk", 268, "hero skip line")
        d.text((1084, 398 + i * 22), line, font=font(12, "cjk"),
               fill=hx(s["sub"]))
    d.text((1084, 444), h["skip_note"], font=font(12.5, "cjk_bold"),
           fill=hx(s["ok"]))
    require_w(h["skip_note"], 12.5, "cjk_bold", 268, "hero skip note")
    d.text((1084, 470), "12 条均写明原因" if lang == "zh"
           else "all 12 state a reason", font=font(11, "cjk"),
           fill=hx(s["faint"]))

    # ---- summary strip ------------------------------------------------------
    img = card(img, (628, 516, 1376, 556), s, radius=18, shadow=14)
    d = ImageDraw.Draw(img)
    x = 652
    for text, key in h["strip"]:
        col = s["ok"] if key == "ok" else s[key]
        d.ellipse([x, 530, x + 9, 539], fill=hx(col))
        d.text((x + 15, 526), text, font=font(12.5, "mono_bold"),
               fill=hx(col))
        require_w(text, 12.5, "mono_bold", 130, "hero strip segment")
        x = int(x + measure(text, 12.5, "mono_bold") + 46)
    require_w(h["strip_right"], 12.5, "cjk_bold", 150, "hero strip right")
    d.text((1352, 526), h["strip_right"], font=font(12.5, "cjk_bold"),
           fill=hx(s["ok"]), anchor="ra")

    name = f"{NAME}-hero-{lang}-{skin}.webp"
    img.save(os.path.join(OUT, name), "WEBP", quality=90, method=6)
    print(f"wrote {name} ({W}x{H})")


# --------------------------------------------------------------------------- flow
FLOW = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8",
        panel="#ffffff", card="#ffffff", edge="#e6e2ef",
        band="#f5f2fb", pill="#ece7f9", text="#141419", sub="#4d5261",
        faint="#8f94a4",
        accent="#4B67B4", accent2="#16a34a",
        warn="#b45309", warn_bg="#fdf3e9",
        ok="#15803d", ok_bg="#eaf6ee",
        skip="#8f94a4", skip_bg="#f1eef7",
        rule="#e7e4f0", shadow="#2b2440", shadow_op="0.13",
        dot="#cfc8e2", dot_op="0.55",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016",
        panel="#1b2231", card="#1b2231", edge="#2e374b",
        band="#202839", pill="#242d42", text="#f0f3f9", sub="#a8b1c4",
        faint="#737b8d",
        accent="#8496f5", accent2="#3fb950",
        warn="#d9a441", warn_bg="#2a2216",
        ok="#3fb950", ok_bg="#16281c",
        skip="#737b8d", skip_bg="#222a3b",
        rule="#2b3348", shadow="#000000", shadow_op="0.50",
        dot="#2a3346", dot_op="0.55",
    ),
}

FONT_CSS_SANS = ("'Microsoft YaHei','Segoe UI','PingFang SC',"
                 "'Noto Sans CJK SC',sans-serif")
FONT_CSS_MONO = ("Consolas,'Microsoft YaHei',ui-monospace,monospace")


class Svg:
    """Small SVG writer that measures every label before it is emitted."""

    def __init__(self) -> None:
        self.parts: list[str] = []
        self.overflows: list[str] = []

    def add(self, markup: str) -> None:
        self.parts.append(markup)

    def _w(self, content: str, size: float, kind: str) -> float:
        path = FONT_FILES[kind]
        if not content.isascii() and "mono" in kind:
            path = FONT_FILES["cjk_bold" if "bold" in kind else "cjk"]
        return _MEASURE.textlength(content, font=ImageFont.truetype(path, size))

    def text(self, x: float, y: float, content: str, size: float, fill: str, *,
             anchor: str = "start", weight: int | None = None,
             mono: bool = False, max_w: float | None = None,
             opacity: float | None = None) -> None:
        kind = ("mono" if mono else "cjk") + ("_bold" if weight else "")
        if mono and weight:
            kind = "mono_bold"
        if max_w is not None:
            got = self._w(content, size, kind)
            if got > max_w + 0.4:
                self.overflows.append(f"{content!r} needs {got:.1f}px > "
                                      f"{max_w:.0f}px")
        family = FONT_CSS_MONO if mono else FONT_CSS_SANS
        attrs = [f'x="{x}"', f'y="{y}"', f'fill="{fill}"',
                 f'font-family="{family}"', f'font-size="{size}"']
        if anchor != "start":
            attrs.append(f'text-anchor="{anchor}"')
        if weight:
            attrs.append(f'font-weight="{weight}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add(f'<text {" ".join(attrs)}>{escape(content)}</text>')

    def rect(self, x: float, y: float, w: float, h: float, *, fill: str,
             rx: float = 0, stroke: str | None = None, sw: float = 1.5,
             shadow: bool = False, dash: str | None = None,
             opacity: float | None = None) -> None:
        attrs = [f'x="{x}"', f'y="{y}"', f'width="{w}"', f'height="{h}"']
        if rx:
            attrs.append(f'rx="{rx}"')
        attrs.append(f'fill="{fill}"')
        if stroke:
            attrs.append(f'stroke="{stroke}"')
            attrs.append(f'stroke-width="{sw}"')
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        if shadow:
            attrs.append('filter="url(#soft)"')
        self.add(f'<rect {" ".join(attrs)}/>')

    def line(self, x1: float, y1: float, x2: float, y2: float, *, stroke: str,
             sw: float = 1.5, dash: str | None = None,
             marker: str | None = None, opacity: float | None = None) -> None:
        attrs = [f'x1="{x1}"', f'y1="{y1}"', f'x2="{x2}"', f'y2="{y2}"',
                 f'stroke="{stroke}"', f'stroke-width="{sw}"']
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if marker:
            attrs.append(f'marker-end="url(#{marker})"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add(f'<line {" ".join(attrs)}/>')

    def path(self, d: str, *, stroke: str, sw: float = 1.5,
             marker: str | None = None, dash: str | None = None,
             opacity: float | None = None, start_marker: str | None = None) -> None:
        attrs = [f'd="{d}"', 'fill="none"', f'stroke="{stroke}"',
                 f'stroke-width="{sw}"', 'stroke-linejoin="round"',
                 'stroke-linecap="round"']
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if marker:
            attrs.append(f'marker-end="url(#{marker})"')
        if start_marker:
            attrs.append(f'marker-start="url(#{start_marker})"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add(f'<path {" ".join(attrs)}/>')

    def circle(self, cx: float, cy: float, r: float, *, fill: str,
               stroke: str | None = None, sw: float = 1.5) -> None:
        attrs = [f'cx="{cx}"', f'cy="{cy}"', f'r="{r}"', f'fill="{fill}"']
        if stroke:
            attrs.append(f'stroke="{stroke}"')
            attrs.append(f'stroke-width="{sw}"')
        self.add(f'<circle {" ".join(attrs)}/>')

    def chip_right(self, right: float, y: float, label: str, fg: str, bg: str,
                   *, size: float = 11, pad: float = 9, height: float = 22,
                   mono: bool = False, weight: int | None = None,
                   stroke: str | None = None, dash: str | None = None) -> float:
        kind = "mono" if mono else "cjk"
        if weight:
            kind += "_bold"
        w = self._w(label, size, kind) + pad * 2
        x = right - w
        self.rect(x, y, w, height, fill=bg, rx=height / 2, stroke=stroke,
                  sw=1.2, dash=dash)
        self.text(x + pad, y + height / 2 + size * 0.34, label, size, fg,
                  weight=weight, mono=mono)
        return x

    def svg(self, w: int, h: int, title: str, desc: str) -> str:
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" '
                f'height="{h}" viewBox="0 0 {w} {h}" role="img" '
                f'aria-labelledby="title desc">')
        return "\n".join([head, f'<title id="title">{escape(title)}</title>',
                          f'<desc id="desc">{escape(desc)}</desc>',
                          *self.parts, "</svg>"]) + "\n"


def gate_chip(v: Svg, x: float, y: float, rule: str, outcome: str,
              state: str, s: dict) -> float:
    """One rule gate: rule id (13px) + outcome, colored by the run state."""
    style = {
        "warn": (s["warn"], s["warn_bg"]),
        "info": (s["accent"], s["pill"]),
        "clean": (s["ok"], s["ok_bg"]),
        "skip": (s["skip"], s["skip_bg"]),
    }[state]
    label = f"{rule} · {outcome}"
    w = v._w(label, 13, "cjk_bold") + 22
    v.rect(x, y, w, 22, fill=style[1], rx=11, stroke=style[0], sw=1.3,
           dash="4 3" if state == "skip" else None)
    v.text(x + 11, y + 15, label, 13, style[0], weight=700,
           max_w=w - 18)
    return x + w


def flow_svg(skin: str) -> str:
    s = FLOW[skin]
    W, H = 1100, 660
    v = Svg()

    v.add("<defs>")
    v.add(f'<linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">'
          f'<stop offset="0" stop-color="{s["bg_from"]}"/>'
          f'<stop offset="1" stop-color="{s["bg_to"]}"/></linearGradient>')
    v.add(f'<filter id="soft" x="-30%" y="-30%" width="160%" height="180%">'
          f'<feDropShadow dx="0" dy="8" stdDeviation="10" '
          f'flood-color="{s["shadow"]}" '
          f'flood-opacity="{s["shadow_op"]}"/></filter>')
    v.add('<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" '
          'markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
          f'<path d="M0 0 L10 5 L0 10 z" fill="{s["accent"]}"/></marker>')
    v.add(f'<pattern id="dots" width="24" height="24" '
          f'patternUnits="userSpaceOnUse">'
          f'<circle cx="1.2" cy="1.2" r="1.2" fill="{s["dot"]}"/>'
          f'</pattern>')
    v.add("</defs>")

    v.rect(0, 0, W, H, fill="url(#bg)")
    v.rect(0, 0, W, H, fill="url(#dots)", opacity=s["dot_op"])

    # ---- header -------------------------------------------------------------
    v.text(44, 50, NAME, 27, s["text"], weight=700, mono=True, max_w=430)
    v.text(44, 78,
           "Three evidence lanes over one service-period ruler; fourteen gates "
           "feed two report channels.", 14, s["sub"], max_w=690)
    v.chip_right(1056, 32, "rules/site-log-check.yaml · 14 rules · 2026.1",
                 s["accent"], s["pill"], size=11.5, pad=12, height=28,
                 mono=True)
    v.text(44, 104,
           "IN · JSON / YAML · project.serviceStart/End · logs[] · "
           "keyWorks[] · onsite[]", 11, s["faint"], mono=True, max_w=560)
    v.text(1056, 104, "OUT · issues[] + skipped[] · 3 delivery forms",
           11, s["faint"], mono=True, anchor="end", max_w=330)
    v.line(44, 114, 1056, 114, stroke=s["rule"], sw=1, opacity=0.75)

    # ---- lane A: logs[] -----------------------------------------------------
    v.rect(44, 126, 632, 170, fill=s["panel"], rx=20, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.circle(66, 148, 12, fill=s["pill"])
    v.text(66, 152, "A", 11.5, s["accent"], weight=700, mono=True,
           anchor="middle")
    v.text(88, 152, "logs[]", 15, s["text"], weight=700, max_w=120)
    v.text(88, 171, "daily supervision log", 11.5, s["sub"], max_w=160)
    v.text(88, 187, "one per calendar day", 11.5, s["sub"], max_w=160)
    v.text(88, 203, "5 required columns", 11, s["faint"], max_w=160)

    v.text(260, 164, "service period · 2026-03-01 → 2026-03-05", 11,
           s["faint"], mono=True, max_w=390)
    col_x, col_w = 260, 78
    for i in range(5):
        cx = col_x + col_w * i + 39
        v.text(cx, 184, f"03-0{i + 1}", 11.5, s["sub"], mono=True,
               anchor="middle")

    # column 1: two logs on the same calendar day, stacked
    for i, (date, who) in enumerate((("03-01", "Zhang"), ("03-01", "Wang"))):
        x = 260 + i * 8
        y = 192 + i * 32
        v.rect(x, y, 70, 34, fill=s["warn_bg"], rx=10, stroke=s["warn"],
               sw=1.3)
        v.text(x + 8, y + 14, date, 13, s["warn"], weight=700, mono=True,
               max_w=54)
        v.text(x + 8, y + 28, who, 11, s["sub"], max_w=54)

    for i in range(1, 5):
        x = col_x + col_w * i
        v.rect(x, 192, 70, 56, fill=s["skip_bg"], rx=10, stroke=s["skip"],
               sw=1.2, dash="4 4")
        v.text(x + 35, 214, "no log", 13, s["skip"], anchor="middle",
               max_w=62)
        v.text(x + 35, 232, "day missing", 11, s["faint"], anchor="middle",
               max_w=62)

    # gates read only, then report their outcome
    x = gate_chip(v, 260, 266, "SL-001", "warn", "warn", s)
    x = gate_chip(v, x + 10, 266, "SL-002", "info ×4", "info", s)
    gate_chip(v, x + 10, 266, "SL-003…007", "clean", "clean", s)

    # ---- lane B: keyWorks[] -------------------------------------------------
    v.rect(44, 308, 632, 92, fill=s["panel"], rx=20, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.circle(66, 330, 12, fill=s["pill"])
    v.text(66, 334, "B", 11.5, s["accent"], weight=700, mono=True,
           anchor="middle")
    v.text(88, 334, "keyWorks[]", 15, s["text"], weight=700, max_w=150)
    v.text(88, 353, "declared key works", 11.5, s["sub"], max_w=162)
    v.text(88, 369, "name · contractor", 11, s["sub"], max_w=160)
    v.text(88, 385, "absent from the sample", 11, s["warn"], max_w=160)

    for j, (label, w) in enumerate((("name", 64), ("contractor", 100))):
        x = 260 + j * 76
        v.rect(x, 342, w, 22, fill=s["skip_bg"], rx=8, stroke=s["skip"],
               sw=1.2, dash="4 3")
        v.text(x + 9, 357, label, 11, s["skip"], mono=True, max_w=w - 16)

    gate_chip(v, 260, 372, "SL-008", "skip", "skip", s)
    gate_chip(v, 374, 372, "SL-012", "skip", "skip", s)

    # ---- lane C: onsite[] ---------------------------------------------------
    v.rect(44, 416, 632, 140, fill=s["panel"], rx=20, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.circle(66, 438, 12, fill=s["pill"])
    v.text(66, 442, "C", 11.5, s["accent"], weight=700, mono=True,
           anchor="middle")
    v.text(88, 442, "onsite[]", 15, s["text"], weight=700, max_w=120)
    v.text(88, 461, "on-site supervision record", 11.5, s["sub"], max_w=160)
    v.text(88, 477, "Table A.0.6", 11, s["sub"], max_w=160)
    v.text(88, 493, "record shape only", 11, s["faint"], max_w=160)

    v.rect(260, 470, 260, 72, fill=s["skip_bg"], rx=14, stroke=s["skip"],
           sw=1.2, dash="5 4")
    v.text(276, 488, "record shape · not in the sample", 11, s["faint"],
           max_w=228)
    v.text(276, 506, "keyWork · contractor", 11.5, s["skip"], mono=True,
           max_w=228)
    v.text(276, 523, "startedAt → endedAt", 11.5, s["skip"], mono=True,
           max_w=228)
    v.text(276, 539, "issues · two signatures", 11.5, s["skip"], mono=True,
           max_w=228)

    v.text(540, 452, "all skipped · no records", 11, s["warn"], max_w=130)
    for j, rule in enumerate(("SL-009", "SL-010", "SL-011", "SL-014")):
        y = 466 + j * 22
        v.rect(552, y, 110, 20, fill=s["skip_bg"], rx=10, stroke=s["skip"],
               sw=1.1, dash="4 3")
        v.text(562, y + 14, f"{rule} · skip", 12, s["skip"], weight=700,
               mono=True, max_w=92)

    # ---- cross-lane bridges -------------------------------------------------
    # SL-012: declared key work -> on-site record (name containment).
    v.path("M426 394 V470", stroke=s["accent"], sw=1.6, dash="5 4",
           marker="arr", opacity=0.8)
    v.text(436, 440, "name match", 11, s["accent"], max_w=80)

    # SL-013: a log's on-site claim -> the same-day record.  Routed down the
    # free right-hand channel of lane B, over the lane background, into C.
    v.path("M536 296 V518 H522", stroke=s["accent"], sw=2, dash="6 5",
           marker="arr", opacity=0.9)
    v.rect(546, 326, 70, 22, fill=s["pill"], rx=11)
    v.text(556, 341, "SL-013", 13, s["accent"], weight=700, mono=True,
           max_w=52)
    v.text(546, 362, "log claims on-site", 11, s["accent"], max_w=120)
    v.text(546, 376, "⇄ same-day record", 11, s["accent"], max_w=120)

    # ---- report collector ---------------------------------------------------
    bus = 696
    for y in (200, 354, 460):
        v.line(676, y, bus, y, stroke=s["rule"], sw=1.4)
    v.line(bus, 200, bus, 460, stroke=s["rule"], sw=1.4)
    v.line(bus, 200, 712, 200, stroke=s["accent"], sw=1.6, marker="arr")
    v.line(bus, 354, 712, 354, stroke=s["accent"], sw=1.6, marker="arr")

    # ---- issues[] -----------------------------------------------------------
    v.rect(712, 126, 344, 206, fill=s["panel"], rx=20, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(732, 152, "issues[]", 16, s["text"], weight=700, max_w=120)
    v.chip_right(1036, 134, "5", s["accent"], s["pill"], size=11.5,
                 pad=10, height=24, mono=True, weight=700)
    v.text(732, 172, "warn 1 · info 4 · error 0", 11.5, s["sub"], mono=True,
           max_w=290)
    v.line(732, 184, 1036, 184, stroke=s["rule"], sw=1)

    v.text(732, 202, "SL-001 · warn · cell 2026-03-01", 13, s["warn"],
           weight=700, mono=True, max_w=300)
    v.text(732, 221, "found     2 logs on the same calendar day", 11.5,
           s["sub"], max_w=300)
    v.text(732, 239, "expected  1 log per calendar day", 11.5, s["sub"],
           max_w=300)
    v.text(732, 257, "fix       check duplicate filing / re-entry", 11.5,
           s["sub"], max_w=300)
    v.text(732, 275, "basis     GB/T 50319-2013 2.0.21 · verbatim", 11,
           s["faint"], max_w=300)
    v.line(732, 287, 1036, 287, stroke=s["rule"], sw=1)
    v.text(732, 303, "locator · cell / row / column · stable id", 11,
           s["faint"], max_w=300)
    v.text(732, 321, "no error · the cited standard is recommended", 11,
           s["warn"], max_w=300)

    # ---- skipped[] ----------------------------------------------------------
    v.rect(712, 348, 344, 122, fill=s["panel"], rx=20, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(732, 373, "skipped[] · 12", 16, s["text"], weight=700, max_w=180)
    v.text(732, 392, "each reason is written down", 11, s["faint"], max_w=280)
    v.text(732, 414, "7 · material missing → cannot run", 11.5,
           s["sub"], max_w=300)
    v.text(732, 434, "5 · ran, no difference · still listed", 11.5,
           s["sub"], max_w=300)
    v.text(732, 458, "a non-run is never a pass", 12.5, s["ok"], weight=700,
           max_w=300)

    # ---- delivery -----------------------------------------------------------
    v.rect(712, 486, 344, 70, fill=s["panel"], rx=20, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(732, 509, "delivery · one run, three forms", 13, s["text"],
           weight=700, max_w=300)
    v.text(732, 527, "markdown · reportJson · workbookBase64", 11.5,
           s["sub"], mono=True, max_w=300)
    v.text(732, 545, "xlsx · summary / findings / not-run", 11, s["faint"],
           max_w=300)

    # ---- footer -------------------------------------------------------------
    v.line(44, 574, 1056, 574, stroke=s["rule"], sw=1)
    v.text(44, 596, "one run · quickstart: 2 logs on 03-01 → SL-001 warn · "
           "4 gaps → SL-002 info ×4 · 12 skipped · 0 error", 11.5, s["sub"],
           max_w=790)
    v.text(1056, 596, "empty issues ≠ all clear", 12, s["ok"], weight=700,
           anchor="end", max_w=220)
    v.text(44, 620, "solid = present in the sample · dashed = surface absent, "
           "the gate names itself in skipped[] · each issue carries cell/row + "
           "clause", 11, s["sub"], max_w=1012)
    v.text(44, 642, "rulesFile · disabledRules · onlyRules · skipNotes · "
           "timeoutMs · read-only · no network · no model call", 11,
           s["faint"], mono=True, max_w=1012)

    if v.overflows:
        raise SystemExit("FATAL: SVG label overflow:\n  " +
                         "\n  ".join(v.overflows))
    return v.svg(
        W, H,
        "dsh-site-log-check three evidence swimlanes",
        "Three material surfaces stacked as swimlanes over one service-period "
        "day ruler. Lane A holds logs[] and the SL-001 / SL-002 / "
        "SL-003…SL-007 gates; two logs on 2026-03-01 and four hollow calendar "
        "days are drawn from the quickstart sample. Lane B holds keyWorks[] "
        "with SL-008 and SL-012. Lane C holds the onsite[] record shape and "
        "SL-009 / SL-010 / SL-011 / SL-014. Two cross-lane bridges carry "
        "SL-012 (key work name match) and SL-013 (a log's on-site claim to the "
        "same-day record). The lanes aggregate into issues[] and skipped[]. "
        "The run strip quotes the quickstart result: 0 error, 1 warn, 4 info, "
        "12 skipped; skipped splits into 7 checks that could not run and 5 "
        "that ran without a difference but are still listed.",
    )


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        for lang in ("zh", "en"):
            hero(lang, skin)
        name = f"{NAME}-flow-v5-{skin}.svg"
        with open(os.path.join(OUT, name), "w", encoding="utf-8",
                  newline="\n") as fh:
            fh.write(flow_svg(skin))
        print(f"wrote {name} (1100x660)")


if __name__ == "__main__":
    main()
