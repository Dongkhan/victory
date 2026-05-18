// 일반 브라우저로 renderer 를 직접 열었을 때(window.dhtalk 부재) 표시하는 안내.
// mock 을 제공하지 않는 이유: 실제 동작처럼 보이면 원장/데스크가 오해할 수 있다.
export default function BrowserNotice() {
  return (
    <div className="notice">
      <div className="notice__box">
        <h1>DH Talk</h1>
        <p>이 화면은 Electron 데스크탑 앱 전용입니다.</p>
        <p>
          일반 브라우저에서는 동작하지 않습니다. 개발 중에는 <code>npm run dev</code>,
          실사용 시에는 설치된 <strong>DH Talk</strong> 앱으로 실행하세요.
        </p>
      </div>
    </div>
  );
}
