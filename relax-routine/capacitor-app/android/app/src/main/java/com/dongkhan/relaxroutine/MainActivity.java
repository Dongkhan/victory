package com.dongkhan.relaxroutine;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setUpImmersiveFullscreen();
        registerImmersiveListener();
    }

    /** 화면을 꽉 채우고 시스템 바(상태 바 + 하단 내비게이션 바)를 숨긴다. */
    private void setUpImmersiveFullscreen() {
        Window window = getWindow();
        if (window == null) return;
        WindowInsetsController controller = window.getInsetsController();
        if (controller != null) {
            // 상태 바 + 하단 내비게이션 바 모두 숨김 → 앱이 화면 전체를 사용
            controller.hide(WindowInsets.Type.systemBars());
            // 살짝 스와이프하면 잠깐 나타났다 자동으로 다시 숨는 방식
            controller.setSystemBarsBehavior(
                WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }
    }

    /** 화면 전환(회전 등) 후 시스템 바가 다시 나타나면 자동으로 다시 숨긴다. */
    private void registerImmersiveListener() {
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if ((visibility & View.SYSTEM_UI_FLAG_FULLSCREEN) == 0) {
                setUpImmersiveFullscreen();
            }
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // 창에 포커스가 다시 들어올 때도 시스템 바를 숨김 유지
        if (hasFocus) {
            setUpImmersiveFullscreen();
        }
    }
}
