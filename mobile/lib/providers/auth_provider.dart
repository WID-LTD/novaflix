import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

enum AuthStatus { unknown, unauthenticated, authenticated, needsVerification, loading }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;
  final String? pendingEmail;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.pendingEmail,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    String? pendingEmail,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
      pendingEmail: pendingEmail ?? this.pendingEmail,
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

  Future<void> register(String email, String username, String password) async {
    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      await _authService.register(email, username, password);
      state = state.copyWith(
        status: AuthStatus.needsVerification,
        pendingEmail: email,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
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
      } else {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          error: e.message,
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  Future<void> verifyEmail(String code) async {
    final email = state.pendingEmail;
    if (email == null) return;

    state = state.copyWith(status: AuthStatus.loading, clearError: true);
    try {
      await _authService.verifyEmail(email, code);
      state = state.copyWith(status: AuthStatus.unauthenticated);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.needsVerification,
        error: e.toString(),
      );
    }
  }

  Future<void> resendVerification() async {
    final email = state.pendingEmail;
    if (email == null) return;

    try {
      await _authService.resendVerification(email);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});
