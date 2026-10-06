package com.sakurayo.zombietide;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
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
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final String TAG = "SakurayoWebView";
    private static final String GAME_URL = "file:///android_asset/index.html";
    private static final long EXIT_CONFIRM_WINDOW_MS = 1800L;

    private static final String ANDROID_BACK_SCRIPT = "window.SakurayoPlatform ? window.SakurayoPlatform.back() : false";
    private static final int EXPORT_JSON_REQUEST = 48;
    private static final String EXPORT_PENDING = "exportPending";
    private boolean exportPending;
    private boolean appResumed;
    private File exportPayload;

    private WebView webView;
    private long lastExitRequestAt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        configureWindow();
        exportPayload = new File(getCacheDir(), "pending-export.json");
        exportPending = savedInstanceState != null
                && savedInstanceState.getBoolean(EXPORT_PENDING, false) && exportPayload.isFile();
        if (!exportPending) deleteExportPayload();
        webView = createWebView();

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8, 6, 17));
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        // WebView history cannot restore a live JS battle. Start a clean lobby;
        // localStorage retains progress and the pending SAF payload remains on disk.
        webView.loadUrl(GAME_URL);

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
        settings.setUserAgentString(settings.getUserAgentString() + " SakurayoAndroid/4.6.0");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        view.addJavascriptInterface(new AndroidBridge(), "SakurayoAndroid");
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
            return !GAME_URL.equals(request.getUrl().toString());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return !GAME_URL.equals(url);
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
            dispatchPlatform(appResumed ? "resume" : "suspend");
        }
    }

    private final class AndroidBridge {
        @JavascriptInterface
        public void exportJson(String filename, String json) {
            runOnUiThread(() -> beginJsonExport(filename, json));
        }
    }

    @SuppressWarnings("deprecation")
    private void beginJsonExport(String filename, String json) {
        if (exportPending) {
            Toast.makeText(this, "请先完成或取消当前导出", Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            try (FileOutputStream output = new FileOutputStream(exportPayload)) {
                output.write(json.getBytes(StandardCharsets.UTF_8));
            }
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_TITLE, filename.replaceAll("[/\\\\]", "_") );
            exportPending = true;
            startActivityForResult(intent, EXPORT_JSON_REQUEST);
        } catch (IOException | ActivityNotFoundException error) {
            exportPending = false;
            deleteExportPayload();
            Log.e(TAG, "Could not begin JSON export", error);
            Toast.makeText(this, "无法创建导出文件", Toast.LENGTH_LONG).show();
        }
    }

    @SuppressWarnings("deprecation")
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != EXPORT_JSON_REQUEST || !exportPending) return;
        exportPending = false;
        try {
            if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
            try (FileInputStream input = new FileInputStream(exportPayload);
                 OutputStream output = getContentResolver().openOutputStream(data.getData(), "wt")) {
                if (output == null) throw new IOException("No output stream for selected document");
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            }
            Toast.makeText(this, "JSON 已导出", Toast.LENGTH_SHORT).show();
        } catch (IOException error) {
            Log.e(TAG, "Could not write JSON export", error);
            Toast.makeText(this, "导出失败，请重新选择文件", Toast.LENGTH_LONG).show();
        } finally {
            deleteExportPayload();
        }
    }

    private void deleteExportPayload() {
        if (exportPayload != null && exportPayload.exists() && !exportPayload.delete()) {
            Log.w(TAG, "Could not remove pending export cache");
        }
    }

    private void dispatchPlatform(String method) {
        if (webView != null) webView.evaluateJavascript(
                "window.SakurayoPlatform && window.SakurayoPlatform." + method + "()", null);
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
        outState.putBoolean(EXPORT_PENDING, exportPending);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onPause() {
        appResumed = false;
        dispatchPlatform("suspend");
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        appResumed = true;
        if (webView != null) webView.onResume();
        dispatchPlatform("resume");
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
            webView.removeJavascriptInterface("SakurayoAndroid");
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
