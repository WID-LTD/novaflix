import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

enum AuthStatus {
  unknown,
  unauthenticated,
  authenticated,
  needsVerification,
  needsLoginVerification,
  loading,
}

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;
  final String? pendingUserId;
  final String? pendingEmail;
  final String? loginVerifyReason;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.pendingUserId,
    this.pendingEmail,
    this.loginVerifyReason,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    String? pendingUserId,
    String? pendingEmail,
    String? loginVerifyReason,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
      pendingUserId: pendingUserId ?? this.pendingUserId,
      pendingEmail: pendingEmail ?? this.pendingEmail,
      loginVerifyReason: loginVerifyReason ?? this.loginVerifyReason,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState()) {
    _init();
  }

  Future<void> _init() async {
    final user = await _authService.getCurrentUser();
    if (user != null) {
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> register(String email, String password, String? name) async {
    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      final res = await _authService.register(email, password, name);
      final userId = res['userId']?.toString();
      if (userId != null) {
        state = state.copyWith(
          status: AuthStatus.needsVerification,
          pendingUserId: userId,
          pendingEmail: email,
        );
      } else {
        final token = res['token'] as String?;
        if (token != null) {
          final userData = res['user'] as Map<String, dynamic>;
          final user = User.fromJson(userData, token: token);
          state = AuthState(status: AuthStatus.authenticated, user: user);
        }
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: friendlyErrorMessage(e),
      );
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      final user = await _authService.login(email, password);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } on AuthException catch (e) {
      if (e.code == 'verify_email') {
        state = state.copyWith(
          status: AuthStatus.needsVerification,
          pendingEmail: email,
        );
      } else if (e.code == 'login_verify') {
        state = state.copyWith(
          status: AuthStatus.needsLoginVerification,
          pendingUserId: e.userId,
          pendingEmail: email,
          loginVerifyReason: e.reason,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          error: e.message,
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: friendlyErrorMessage(e),
      );
    }
  }

  Future<void> loginVerify(String code) async {
    final userId = state.pendingUserId;
    if (userId == null) return;

    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      final user = await _authService.loginVerify(userId, code);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.needsLoginVerification,
        error: friendlyErrorMessage(e),
      );
    }
  }

  Future<void> verifyEmail(String code) async {
    final userId = state.pendingUserId;
    if (userId == null) return;

    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      final user = await _authService.verifyEmail(userId, code);
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.needsVerification,
        error: friendlyErrorMessage(e),
      );
    }
  }

  Future<void> resendVerification() async {
    final userId = state.pendingUserId;
    if (userId == null) return;
    try {
      await _authService.resendVerification(userId);
    } catch (e) {
      state = state.copyWith(error: friendlyErrorMessage(e));
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  Future<void> refreshUser() async {
    final user = await _authService.getCurrentUser();
    if (user != null) {
      state = AuthState(status: AuthStatus.authenticated, user: user);
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});
