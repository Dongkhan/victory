from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def test_root_index_deep_links_latest_executables():
    index = read("index.html")
    assert 'href="relax-routine/prototype/v3.3.html"' in index
    assert 'href="behavioral-activation/prototype/v2.8.html"' in index
    assert 'href="cbti-care/prototype/v2.272.html"' in index
    assert 'href="DH-TALK_V2/app/"' in index
    assert 'href="family-link-coach/index.html"' in index
    assert index.count("최신 실행본 열기") >= 5


def test_ba_latest_exposes_real_state_hook_and_local_suicide_prevention_copy():
    html = read("behavioral-activation/prototype/v2.8.html")
    assert "__ACTIVACARE_STATE__" in html
    assert "window.state" not in html
    assert "data-safety-state" in html
    assert "보건소 생명존중사업" in html


def test_cbti_latest_exposes_srt_safety_dataset_and_first_week_lock_copy():
    html = read("cbti-care/prototype/v2.272.html")
    assert "__CBTI_CARE_STATE__" in html
    assert "window.state" not in html
    assert "data-srt-state" in html
    assert "첫 7일은 수면일기 우선" in html
    assert "보건소 생명존중사업" in html


def test_dht2_file_panel_is_explicitly_local_temporary_not_real_transfer():
    panel = read("DH-TALK_V2/app/src/features/files/FileTransferPanel.tsx")
    assert "이 PC 임시 첨부" in panel
    assert "다른 PC로 자동 전송되지 않습니다" in panel
    assert "7일 후 만료" not in panel
    assert "브라우저를 닫거나 새로고침하면 사라질 수 있습니다" in panel


def test_dfc_is_p2_consistent_and_uses_delegated_action_guards():
    html = read("family-link-coach/index.html")
    assert "P0" not in html
    assert "familyLinkCoachP2LocalSample" in html
    assert "오늘 만들 결과물" in html
    assert "보건소 생명존중사업" in html
    assert "data-action=\"request-extra-time\"" in html
    assert "onclick=" not in html


def test_rr_latest_has_qa_metadata_and_no_absolute_uuid_assets():
    html = read("relax-routine/prototype/v3.1.html")
    assert "data-app=\"relax-routine\"" in html
    assert "data-version=\"3.1\"" in html
    assert "data-safety-state" in html
    assert not re.search(r"(?:src|href)=['\"]/[0-9a-f]{8}-[0-9a-f-]{27,}['\"]", html, flags=re.I)
