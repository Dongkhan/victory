from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")

def test_ba_v28_is_general_self_guided_app_without_clinic_linkage():
    html = read("behavioral-activation/prototype/v2.8.html")
    latest = read("behavioral-activation/prototype/index.html")
    landing = read("behavioral-activation/index.html")
    readme = read("behavioral-activation/README.md")

    assert "ActivaCare v2.8" in html
    assert "activacare-v28-state" in html
    assert "activacare-v27-state" in html
    assert "Support" in html and "7일 실행 요약" in html
    assert "<span>지원</span>" in html
    assert "생활리듬" in html and "충동관리" in html
    assert "스마트폰 회피" in html and "충동·갈망 관리" in html
    assert "DH Mind Clinic" not in html
    assert "외래" not in html
    assert "진료실" not in html
    assert "담당 의료진" not in html
    assert "의료진 연결" not in html
    assert "외래" not in latest
    assert "현재 버전:</strong> v2.8" in landing
    assert "prototype/v2.8.html" in landing
    assert "v2.8 일반 사용자 전환" in readme
