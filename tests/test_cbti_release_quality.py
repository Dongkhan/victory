from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "cbti-care" / "index.html"


def latest_cbti_html() -> Path:
    files = sorted(
        (ROOT / "cbti-care" / "prototype").glob("v2.*.html"),
        key=lambda p: int(p.stem.split(".")[1]),
    )
    return files[-1]


HTML = latest_cbti_html()


def read_html() -> str:
    assert HTML.exists(), "latest CBT-I release-quality app must exist"
    return HTML.read_text(encoding="utf-8")


def test_latest_release_quality_link_is_current_and_legacy_links_preserved():
    index = INDEX.read_text(encoding="utf-8")
    latest_label = HTML.stem
    assert f'prototype/{latest_label}.html' in index
    assert re.search(rf'{re.escape(latest_label)}\.html.*<small>latest</small>', index, re.S)
    assert index.count("<small>latest</small>") == 1
    assert 'prototype/v1.6.html">CBT-I Care v1.6</a><br>' in index


def test_release_app_has_current_product_surfaces():
    html = read_html()
    latest_label = HTML.stem
    required = [
        f'CBT-I Care {latest_label}',
        '오늘의 실행 플랜',
        '7일 수면 데이터',
        '데이터 내보내기',
        '개인정보·동의',
        '오프라인 저장',
        '임상 안전 가드레일',
        '진료 공유 리포트',
        '릴리즈 체크리스트',
        'cbti-v6-pwa',
        'cbti-v6-hygiene',
    ]
    for text in required:
        assert text in html


def test_release_app_persists_state_and_exports_clinic_report():
    html = read_html()
    required_js = [
        'localStorage.setItem(STORAGE_KEY',
        'localStorage.getItem(STORAGE_KEY',
        'function saveDiaryEntry',
        'function generateClinicReport',
        'function exportClinicReport',
        'function resetDemoData',
        'navigator.onLine',
        'serviceWorker.register',
    ]
    for text in required_js:
        assert text in html


def test_release_app_removes_dummy_language_and_marks_offline_ready():
    html = read_html().lower()
    banned = ['lorem ipsum', 'dummy', 'todo:', 'placeholder patient']
    for text in banned:
        assert text not in html
    assert 'offlineready' in html or '오프라인 저장' in read_html()


def test_release_app_contains_accessible_detail_routes_for_all_primary_cards():
    html = read_html()
    for route in [
        'screen-dashboard',
        'screen-diary',
        'screen-plan',
        'screen-report',
        'screen-learn',
        'screen-settings',
        'screen-session-detail',
        'screen-measure-detail',
        'screen-consent-detail',
        'screen-safety-detail',
    ]:
        assert f'id="{route}"' in html
    assert html.count('data-route=') >= 20
    assert 'aria-live="polite"' in html


def test_release_app_has_clinical_safety_copy():
    html = read_html()
    required = [
        '의료진 상담을 대체하지 않습니다',
        '수면제 감량 속도와 중단은 진료에서 결정',
        '수면무호흡',
        '조증',
        '자살예방 109',
        '지역 위기지원기관',
        '운전·기계작업',
    ]
    for text in required:
        assert text in html
