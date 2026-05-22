from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "cbti-care" / "index.html"
PROTO = ROOT / "cbti-care" / "prototype"

def test_cbti_index_labels_match_hrefs_and_files_exist():
    html = INDEX.read_text(encoding="utf-8")
    assert html.count("<small>latest</small>") == 1
    links = re.findall(r'<a href="prototype/(v\d+\.\d+\.html)">CBT-I Care (v\d+\.\d+)</a>', html)
    assert links
    for href, label in links:
        assert href == f"{label}.html"
        assert (PROTO / href).exists(), href
