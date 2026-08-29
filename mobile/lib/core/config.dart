/// App-wide configuration.
///
/// The app uses only the production Render backend. An explicit
/// `--dart-define=BASE_URL=...` still wins as an override.
class AppConfig {
  AppConfig._();

  static const String _override = String.fromEnvironment('BASE_URL');

  static const String productionBase = 'http://localhost:3030/api';

  static String get apiBaseUrl {
    if (_override.isNotEmpty) return _override;
    return productionBase;
  }

  /// Persisted key marking that the first-run onboarding guide was seen.
  static const String onboardingSeenKey = 'novaflix-onboarding-seen';
}
