package com.sakurayo.zombietide;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final String TAG = "SakurayoWebView";
    private static final String GAME_URL = "file:///android_asset/index.html";
    private static final String TOUCH54_ASSET = "runtime/sakurayo-touch54.js";
    private static final String LAYOUT52_ASSET = "runtime/sakurayo-layout52.js";
    private static final String FEEL53_ASSET = "runtime/sakurayo-feel53.js";
    private static final String BOUTIQUE_ASSET = "runtime/sakurayo-boutique.js";
    private static final long EXIT_CONFIRM_WINDOW_MS = 1800L;
    private static final String ANDROID_LANDSCAPE_SCRIPT =
            "window.__SAKURAYO_ANDROID_LANDSCAPE__=true;" +
            "(function(){var h=document.documentElement;if(!h||!h.classList)return;" +
            "h.classList.add('androidLandscape46','landscape46');" +
            "h.classList.remove('portraitFallback46');})()";

    private static final String ANDROID_BACK_SCRIPT =
            "(function(){" +
            "const visible=e=>!!e&&!e.classList.contains('hidden');" +
            "const click=id=>{const e=document.querySelector(id);if(e){e.click();return true;}return false;};" +
            "const drawer=[...document.querySelectorAll('.drawer')].find(visible);" +
            "if(drawer){const close=drawer.querySelector('.close');if(close)close.click();return true;}" +
            "if(visible(document.querySelector('#result')))return click('#back');" +
            "if(visible(document.querySelector('#paused')))return click('#resume');" +
            "if(visible(document.querySelector('#level'))||visible(document.querySelector('#event'))||" +
            "visible(document.querySelector('#dialogue')))return true;" +
            "if(visible(document.querySelector('#hud')))return click('#pause');" +
            "return false;" +
            "})()";

    private WebView webView;
    private long lastExitRequestAt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        configureWindow();
        webView = createWebView();

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8, 6, 17));
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        boolean restored = savedInstanceState != null && webView.restoreState(savedInstanceState) != null;
        if (!restored) {
            webView.loadUrl(GAME_URL);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    this::handleBackRequest);
        }
    }

    private void configureWindow() {
        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attributes);
        }
        applyImmersiveMode();
    }

    @SuppressLint("SetJavaScriptEnabled")
    @SuppressWarnings("deprecation")
    private WebView createWebView() {
        WebView view = new WebView(this);
        view.setBackgroundColor(Color.rgb(8, 6, 17));
        view.setFocusable(true);
        view.setFocusableInTouchMode(true);
        view.setClickable(true);
        view.setLongClickable(false);
        view.setOverScrollMode(View.OVER_SCROLL_NEVER);
        view.setOnLongClickListener(v -> true);
        view.setOnTouchListener((v, event) -> {
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                v.requestFocus();
            }
            return false;
        });
        view.requestFocus(View.FOCUS_DOWN);

        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setTextZoom(100);
        settings.setDefaultTextEncodingName("utf-8");
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUserAgentString(settings.getUserAgentString() + " SakurayoAndroid/4.6.0-yeying");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        view.setWebViewClient(new OfflineWebViewClient());
        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage message) {
                int priority = message.messageLevel() == ConsoleMessage.MessageLevel.ERROR
                        ? Log.ERROR : Log.DEBUG;
                Log.println(priority, TAG, String.format(
                        Locale.ROOT,
                        "%s:%d %s",
                        message.sourceId(),
                        message.lineNumber(),
                        message.message()));
                return true;
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.deny();
            }
        });
        return view;
    }

    private final class OfflineWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return !isLocalUri(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return !isLocalUri(Uri.parse(url));
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String scheme = uri.getScheme();
            if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                Log.w(TAG, "Blocked remote request: " + uri);
                return new WebResourceResponse(
                        "text/plain",
                        "utf-8",
                        new ByteArrayInputStream(new byte[0]));
            }
            return super.shouldInterceptRequest(view, request);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            applyImmersiveMode();
            view.requestFocus(View.FOCUS_DOWN);
            injectRuntime(view);
        }
    }

    private void injectRuntime(WebView view) {
        if (view == null) return;
        view.evaluateJavascript(ANDROID_LANDSCAPE_SCRIPT, null);
        injectAssetScript(view, TOUCH54_ASSET);
        injectAssetScript(view, LAYOUT52_ASSET);
        injectAssetScript(view, FEEL53_ASSET);
        injectAssetScript(view, BOUTIQUE_ASSET);
    }

    private void injectAssetScript(WebView view, String assetPath) {
        try {
            view.evaluateJavascript(readAssetUtf8(assetPath), null);
        } catch (IOException error) {
            Log.w(TAG, "Unable to boot runtime from " + assetPath, error);
        }
    }

    private String readAssetUtf8(String path) throws IOException {
        try (InputStream input = getAssets().open(path);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static boolean isLocalUri(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        return scheme == null
                || "file".equalsIgnoreCase(scheme)
                || "data".equalsIgnoreCase(scheme)
                || "blob".equalsIgnoreCase(scheme)
                || "about".equalsIgnoreCase(scheme);
    }

    @SuppressWarnings("deprecation")
    private void applyImmersiveMode() {
        Window window = getWindow();
        View decor = window.getDecorView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = decor.getWindowInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            decor.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }

    private void handleBackRequest() {
        if (webView == null) {
            finish();
            return;
        }
        webView.evaluateJavascript(ANDROID_BACK_SCRIPT, value -> {
            if ("true".equals(value)) return;
            if (webView.canGoBack()) {
                webView.goBack();
                return;
            }
            long now = SystemClock.elapsedRealtime();
            if (now - lastExitRequestAt <= EXIT_CONFIRM_WINDOW_MS) {
                finish();
            } else {
                lastExitRequestAt = now;
                Toast.makeText(this, R.string.exit_hint, Toast.LENGTH_SHORT).show();
            }
        });
    }

    @SuppressLint("GestureBackNavigation")
    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        handleBackRequest();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersiveMode();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.loadUrl("about:blank");
            webView.removeAllViews();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
