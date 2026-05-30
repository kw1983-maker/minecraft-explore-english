#!/usr/bin/env python3
"""Build a single self-contained index.html from the modular source.

The modular files in js/ + css/style.css remain the source of truth (and still
work when served over http). This bundles them — inlining the CSS and merging
every module into one inline <script type="module"> — so the result can be
opened directly by double-clicking index.html (file://), with Three.js pulled
from the CDN (https CDN imports are allowed over file://; local ones are not).

Run:  python build.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Order matters: definitions first, main.js last (it runs on load).
JS_ORDER = [
    "js/textures.js",
    "js/audio.js",
    "js/questions.js",
    "js/world.js",
    "js/player.js",
    "js/objectives.js",
    "js/viewmodel.js",
    "js/quiz.js",
    "js/main.js",
]

IMPORT_RE = re.compile(r"^\s*import\b")
EXPORT_RE = re.compile(r"^(\s*)export\s+")


def strip_module_syntax(src: str) -> str:
    """Drop import lines and the leading `export ` keyword."""
    out = []
    for line in src.splitlines():
        if IMPORT_RE.match(line):
            continue  # THREE + cross-module imports are resolved by the bundle scope
        out.append(EXPORT_RE.sub(r"\1", line))
    return "\n".join(out)


def main() -> None:
    css = (ROOT / "css/style.css").read_text(encoding="utf-8")

    chunks = []
    for rel in JS_ORDER:
        code = (ROOT / rel).read_text(encoding="utf-8")
        chunks.append(f"// ===== {rel} =====\n{strip_module_syntax(code)}")
    js = "\n\n".join(chunks)

    template = (ROOT / "build/template.html").read_text(encoding="utf-8")
    html = template.replace("/*__CSS__*/", css).replace("/*__JS__*/", js)

    out = ROOT / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"Built {out} ({len(html):,} bytes) from {len(JS_ORDER)} modules.")


if __name__ == "__main__":
    main()
