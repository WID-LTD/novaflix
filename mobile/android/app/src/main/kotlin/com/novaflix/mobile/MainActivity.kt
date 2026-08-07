package com.novaflix.mobile

import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onResume() {
        super.onResume()
        // Prevent screenshots and screen recording of the app (Netflix-style DRM).
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
}
