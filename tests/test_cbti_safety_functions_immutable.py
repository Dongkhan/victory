from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
NAMES = ["safetyHardFlags","calculateSrtRecommendation","diaryClinicalWarnings","validateDiaryEntry","normalizeImportedEntry"]

def latest():
    return sorted((ROOT/"cbti-care"/"prototype").glob("v2.*.html"), key=lambda p: int(p.stem.split(".")[1]))[-1]

def extract_func(text, name):
    start = text.index("function "+name)
    i = text.index("{", start)
    depth = 0; quote = None; esc = False
    for j in range(i, len(text)):
        c = text[j]
        if quote:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == quote: quote = None
        else:
            if c in "'\"`": quote = c
            elif c == "{": depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0: return text[start:j+1]
    raise AssertionError(name)

def test_clinical_safety_functions_byte_identical_to_v21():
    base = (ROOT/"cbti-care"/"prototype"/"v2.1.html").read_text(encoding="utf-8")
    cur = latest().read_text(encoding="utf-8")
    for name in NAMES:
        assert extract_func(cur, name) == extract_func(base, name), name
