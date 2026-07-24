import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import 'api_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(apiServiceProvider));
});

class AuthService {
  final ApiService _api;

  AuthService(this._api);

  Future<Map<String, dynamic>> register(String email, String password, String? name) async {
    final res = await _api.register(email, password, name);
    return res.data as Map<String, dynamic>;
  }

  Future<User> login(String email, String password) async {
    final res = await _api.login(email, password);
    final data = res.data as Map<String, dynamic>;

    if (data['needsVerification'] == true) {
      throw AuthException('verify_email', data['message'] ?? 'Please verify your email');
    }

    final token = data['token'] as String;
    await _api.saveToken(token);

    final userData = data['user'] as Map<String, dynamic>;
    return User.fromJson(userData, token: token);
  }

  Future<User> verifyEmail(int userId, String code) async {
    final res = await _api.verifyEmail(userId, code);
    final data = res.data as Map<String, dynamic>;

    final token = data['token'] as String?;
    if (token != null) {
      await _api.saveToken(token);
      final userData = data['user'] as Map<String, dynamic>;
      return User.fromJson(userData, token: token);
    }
    throw AuthException('verify_failed', 'Verification failed');
  }

  Future<void> resendVerification(int userId) async {
    await _api.resendVerification(userId);
  }

  Future<User?> getCurrentUser() async {
    final token = await _api.getToken();
    if (token == null) return null;

    try {
      final res = await _api.getMe();
      final data = res.data as Map<String, dynamic>;
      final userData = data['user'] as Map<String, dynamic>? ?? data;
      return User.fromJson(userData, token: token);
    } catch (_) {
      await _api.deleteToken();
      return null;
    }
  }

  Future<void> logout() async {
    await _api.deleteToken();
  }
}

class AuthException implements Exception {
  final String code;
  final String message;
  AuthException(this.code, this.message);

  @override
  String toString() => message;
}
