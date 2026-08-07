import 'package:flutter/foundation.dart';

/// App-wide configuration.
///
/// Resolves the API base URL depending on the build context:
///  - `--dart-define=BASE_URL=...` always wins (explicit override).
///  - Release/profile builds use the production Render backend.
///  - Debug local runs hit the local dev server (Android emulator uses the
///    10.0.2.2 host alias that maps to the host machine's localhost).
class AppConfig {
  AppConfig._();

  static const String _override = String.fromEnvironment('BASE_URL');

  static const String productionBase = 'https://novaflix-ecz9.onrender.com/api';

  static const String _localHostBase = 'http://localhost:3030/api';
  static const String _localAndroidBase = 'http://10.0.2.2:3030/api';

  static String get apiBaseUrl {
    if (_override.isNotEmpty) return _override;
    if (kReleaseMode) return productionBase;
    if (kIsWeb) return _localHostBase;
    if (defaultTargetPlatform == TargetPlatform.android) return _localAndroidBase;
    return _localHostBase;
  }

  /// Persisted key marking that the first-run onboarding guide was seen.
  static const String onboardingSeenKey = 'novaflix-onboarding-seen';
}