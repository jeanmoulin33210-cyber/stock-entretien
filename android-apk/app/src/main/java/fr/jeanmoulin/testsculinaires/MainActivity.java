package fr.jeanmoulin.testsculinaires;

import android.app.Activity;
import android.app.Dialog;
import android.app.DownloadManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Base64;

public class MainActivity extends Activity {
    private static final String APP_URL =
            "https://jeanmoulin33210-cyber.github.io/stock-entretien/tests-culinaires.html";
    private static final String APP_HOST = "jeanmoulin33210-cyber.github.io";
    private static final int FILE_CHOOSER_REQUEST = 7712;

    private WebView mainWebView;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(23, 63, 92));
        getWindow().setNavigationBarColor(Color.rgb(23, 63, 92));

        FrameLayout root = new FrameLayout(this);
        mainWebView = new WebView(this);
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);

        root.addView(mainWebView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 6);
        root.addView(progressBar, progressParams);

        setContentView(root);
        configureWebView(mainWebView);
        mainWebView.loadUrl(APP_URL);
    }

    private void configureWebView(WebView webView) {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        s.setUserAgentString(s.getUserAgentString() + " TestsCulinairesAndroid/338");

        CookieManager.getInstance().setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        webView.addJavascriptInterface(new AndroidDownloads(this), "AndroidDownloads");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(view, request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(view, Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url != null && url.contains(APP_HOST)) {
                    view.evaluateJavascript(
                            "(function(){try{" +
                            "document.documentElement.classList.add('native-android-app');" +
                            "var c=document.getElementById('pwaInstallCard');if(c)c.style.display='none';" +
                            "var b=document.getElementById('installPwaBtn');if(b)b.style.display='none';" +
                            "var s=document.getElementById('pwaStatus');if(s){s.textContent='✓ Android';s.className='pwa-status installed';}" +
                            "}catch(e){}})();", null);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (view == mainWebView) {
                    progressBar.setProgress(newProgress);
                    progressBar.setVisibility(newProgress >= 100 ? ProgressBar.GONE : ProgressBar.VISIBLE);
                }
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture,
                                          android.os.Message resultMsg) {
                final Dialog dialog = new Dialog(MainActivity.this,
                        android.R.style.Theme_DeviceDefault_Light_NoActionBar_Fullscreen);
                WebView child = new WebView(MainActivity.this);
                configureWebView(child);
                child.setTag(dialog);
                dialog.setContentView(child);
                dialog.setOnDismissListener(d -> {
                    try {
                        child.stopLoading();
                        child.loadUrl("about:blank");
                        child.destroy();
                    } catch (Exception ignored) {}
                });
                dialog.show();

                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(child);
                resultMsg.sendToTarget();
                return true;
            }

            @Override
            public void onCloseWindow(WebView window) {
                Object tag = window.getTag();
                if (tag instanceof Dialog) {
                    ((Dialog) tag).dismiss();
                } else {
                    super.onCloseWindow(window);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallbackNew,
                                             FileChooserParams fileChooserParams) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = filePathCallbackNew;

                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                try {
                    String[] accept = fileChooserParams.getAcceptTypes();
                    if (accept != null && accept.length > 0 && accept[0] != null && !accept[0].isEmpty()) {
                        intent.setType(accept[0]);
                    }
                } catch (Exception ignored) {}

                startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
            if (url != null && url.startsWith("blob:")) {
                downloadBlob(webView, url, fileName);
                return;
            }
            if (url != null && url.startsWith("data:")) {
                new AndroidDownloads(MainActivity.this).saveDataUrl(url, fileName);
                return;
            }
            downloadHttp(url, userAgent, fileName, mimetype);
        });
    }

    private boolean handleNavigation(WebView view, Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();

        if ("about".equals(scheme) || "blob".equals(scheme) || "data".equals(scheme)) {
            return false;
        }

        if ("http".equals(scheme) || "https".equals(scheme)) {
            String host = uri.getHost();
            if (host != null && host.equalsIgnoreCase(APP_HOST)) {
                return false;
            }
            openExternal(uri);
            return true;
        }

        if ("intent".equals(scheme)) {
            try {
                Intent intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(this, "Impossible d’ouvrir ce lien.", Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        if ("mailto".equals(scheme) || "tel".equals(scheme) || "sms".equals(scheme)) {
            openExternal(uri);
            return true;
        }

        return false;
    }

    private void openExternal(Uri uri) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(i);
        } catch (Exception e) {
            Toast.makeText(this, "Aucune application ne peut ouvrir ce lien.", Toast.LENGTH_SHORT).show();
        }
    }

    private void downloadHttp(String url, String userAgent, String fileName, String mimeType) {
        if (url == null || url.isEmpty()) return;
        try {
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
            req.setTitle(fileName);
            req.setDescription("Téléchargement depuis Tests culinaires");
            req.setMimeType(mimeType);
            req.addRequestHeader("User-Agent", userAgent);
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            }
            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            dm.enqueue(req);
            Toast.makeText(this, "Téléchargement lancé.", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            openExternal(Uri.parse(url));
        }
    }

    private void downloadBlob(WebView view, String blobUrl, String fileName) {
        String js =
                "(async function(){" +
                "try{" +
                "const r=await fetch(" + JSONObject.quote(blobUrl) + ");" +
                "const b=await r.blob();" +
                "const fr=new FileReader();" +
                "fr.onloadend=function(){AndroidDownloads.saveDataUrl(fr.result," +
                JSONObject.quote(fileName) + ");};" +
                "fr.readAsDataURL(b);" +
                "}catch(e){alert('Impossible de télécharger le fichier : '+e);}" +
                "})();";
        view.evaluateJavascript(js, null);
    }

    public class AndroidDownloads {
        private final Context context;

        AndroidDownloads(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void saveDataUrl(String dataUrl, String suggestedName) {
            if (dataUrl == null || !dataUrl.startsWith("data:")) return;
            try {
                int comma = dataUrl.indexOf(',');
                if (comma < 0) return;

                String header = dataUrl.substring(5, comma);
                String encoded = dataUrl.substring(comma + 1);
                String mime = header.split(";")[0];
                if (mime == null || mime.isEmpty()) mime = "application/octet-stream";

                byte[] bytes;
                if (header.contains(";base64")) {
                    bytes = Base64.getDecoder().decode(encoded);
                } else {
                    bytes = Uri.decode(encoded).getBytes(java.nio.charset.StandardCharsets.UTF_8);
                }

                String fileName = sanitizeFileName(suggestedName);
                if (fileName.isEmpty()) {
                    String ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);
                    fileName = "tests-culinaires-" + System.currentTimeMillis() +
                            (ext == null ? "" : "." + ext);
                }
                saveBytes(bytes, fileName, mime);
            } catch (Exception e) {
                runOnUiThread(() ->
                        Toast.makeText(context, "Échec du téléchargement : " + e.getMessage(),
                                Toast.LENGTH_LONG).show());
            }
        }

        private String sanitizeFileName(String name) {
            if (name == null) return "";
            return name.replaceAll("[\\/:*?\"<>|]", "-").trim();
        }

        private void saveBytes(byte[] bytes, String fileName, String mime) throws Exception {
            Uri savedUri = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                savedUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (savedUri == null) throw new IllegalStateException("Création du fichier impossible");

                try (OutputStream os = resolver.openOutputStream(savedUri)) {
                    if (os == null) throw new IllegalStateException("Ouverture du fichier impossible");
                    os.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(savedUri, values, null, null);
            } else {
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) throw new IllegalStateException("Dossier de téléchargement indisponible");
                File target = new File(dir, fileName);
                try (FileOutputStream os = new FileOutputStream(target)) {
                    os.write(bytes);
                }
                savedUri = Uri.fromFile(target);
            }

            Uri finalSavedUri = savedUri;
            runOnUiThread(() ->
                    Toast.makeText(context,
                            "Fichier enregistré dans Téléchargements : " + fileName,
                            Toast.LENGTH_LONG).show());
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(result);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (mainWebView != null && mainWebView.canGoBack()) {
            mainWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (mainWebView != null) {
            mainWebView.stopLoading();
            mainWebView.loadUrl("about:blank");
            mainWebView.destroy();
        }
        super.onDestroy();
    }
}
