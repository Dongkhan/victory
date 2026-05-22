from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
def latest_cbti_html():
    files = sorted((ROOT / 'cbti-care' / 'prototype').glob('v2.*.html'), key=lambda p: int(p.stem.split('.')[1]))
    return files[-1]

HTML = latest_cbti_html()
INDEX = ROOT / "cbti-care" / "index.html"


def read_html() -> str:
    assert HTML.exists(), "latest CBT-I release-quality app must exist"
    return HTML.read_text(encoding="utf-8")


def test_legacy_release_quality_v07_link_is_preserved():
    index = INDEX.read_text(encoding="utf-8")
    assert 'prototype/v0.7.html' in index
    assert 'QA 7일 데이터 입력' in index
    assert not re.search(r'v0\.7\.html.*<small>latest</small>', index)
    assert re.search(r'v2\.\d+\.html.*<small>latest</small>', index)
    assert 'prototype/v1.6.html">CBT-I Care v1.6</a><br>' in index


def test_release_app_has_non_prototype_product_surfaces():
    html = read_html()
    required = [
        'CBT-I Care v0.7',
        '출시 직전 앱 수준',
        '오늘의 실행 플랜',
        '7일 수면 데이터',
        '데이터 내보내기',
        '개인정보·동의',
        '오프라인 저장',
        '임상 안전 가드레일',
        '진료 공유 리포트',
        '릴리즈 체크리스트',
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
        'beforeinstallprompt',
    ]
    for text in required_js:
        assert text in html


def test_release_app_removes_dummy_language_and_marks_sample_data():
    html = read_html().lower()
    banned = ['lorem ipsum', 'dummy', 'todo:', 'placeholder patient']
    for text in banned:
        assert text not in html
    assert '샘플 데이터' in read_html()
    assert '실제 저장 데이터' in read_html()


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
        '보건소 생명존중사업',
        '운전·기계작업',
    ]
    for text in required:
        assert text in html
