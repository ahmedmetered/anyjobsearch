#!/usr/bin/env python
"""audit_layout.py — numerically compare two PDFs' text layout (y-positions, sizes).

The core discipline of pixel-matching: never judge by eye. After rebuilding a
design in HTML and printing it to PDF, compare it against the reference with
numbers. This tool lists, per page: text lines whose y-position or font size
differs beyond a tolerance, plus a summary of matched/mismatched lines.

Usage:
  python audit_layout.py reference.pdf rebuilt.pdf [--tol 2.0] [--pages 1,2]

Exit code 0 when every page is within tolerance, 1 otherwise — usable as a loop:
rebuild, audit, adjust, repeat until clean.
"""
import sys

import pymupdf


def page_lines(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = [s for s in line["spans"] if s["text"].strip()]
            if spans:
                text = " ".join(s["text"].strip() for s in spans)
                out.append((round(line["bbox"][1], 1), round(spans[0]["size"], 1), text))
    return sorted(out)


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    tol = float(sys.argv[sys.argv.index("--tol") + 1]) if "--tol" in sys.argv else 2.0
    if len(args) < 2:
        sys.exit(__doc__)
    ref, new = pymupdf.open(args[0]), pymupdf.open(args[1])
    bad = 0
    for p in range(min(len(ref), len(new))):
        a, b = page_lines(ref[p]), page_lines(new[p])
        # match lines by text (fall back to nearest by order when texts differ)
        bmap = {}
        used = set()
        for y, s, t in a:
            best = None
            for i, (y2, s2, t2) in enumerate(b):
                if i in used:
                    continue
                if t == t:
                    best = i
                    break
                if best is None and abs(y2 - y) < tol * 3:
                    best = i
            if best is None:
                print(f"p{p+1}: ONLY IN REFERENCE: y={y} {t[:50]}")
                bad += 1
                continue
            used.add(best)
            y2, s2, _ = b[best]
            if abs(y - y2) > tol or s != s2:
                print(f"p{p+1}: MOVED  ref y={y} {s}pt -> new y={y2} {s2}pt  | {t[:44]}")
                bad += 1
        for i, (y2, s2, t2) in enumerate(b):
            if i not in used:
                print(f"p{p+1}: ONLY IN REBUILD: y={y2} {t2[:50]}")
                bad += 1
        print(f"p{p+1}: {len(a)} ref lines vs {len(b)} rebuilt · {bad} total issue(s) so far")
    print("LAYOUT MATCHES" if bad == 0 else f"{bad} issue(s) — fix and re-run")
    sys.exit(0 if bad == 0 else 1)


if __name__ == "__main__":
    main()
