import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isSignUp = false;
  bool _showPassword = false;
  final _emailCtl = TextEditingController();
  final _passwordCtl = TextEditingController();
  final _nameCtl = TextEditingController();
  final _codeCtl = TextEditingController();

  @override
  void dispose() {
    _emailCtl.dispose();
    _passwordCtl.dispose();
    _nameCtl.dispose();
    _codeCtl.dispose();
    super.dispose();
  }

  void _submit() {
    final email = _emailCtl.text.trim();
    final password = _passwordCtl.text;
    if (email.isEmpty || password.isEmpty) return;

    if (_isSignUp) {
      ref.read(authProvider.notifier).register(email, password, _nameCtl.text.trim());
    } else {
      ref.read(authProvider.notifier).login(email, password);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isVerify = authState.status == AuthStatus.needsVerification;

    if (authState.status == AuthStatus.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/home'));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: isVerify ? _buildVerify(authState) : _buildAuth(authState),
          ),
        ),
      ),
    );
  }

  Widget _buildAuth(AuthState state) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.play_circle_fill, size: 60, color: AppColors.primary),
        const SizedBox(height: 16),
        Text('NOVAFLIX', style: AppTypography.displayMd.copyWith(fontSize: 36, letterSpacing: 4, fontWeight: FontWeight.w900, color: AppColors.onSurface)),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              AnimatedCrossFade(
                duration: const Duration(milliseconds: 300),
                crossFadeState: _isSignUp ? CrossFadeState.showFirst : CrossFadeState.showSecond,
                firstChild: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: AppInput(controller: _nameCtl, label: 'Display Name', hint: 'Enter your name'),
                ),
                secondChild: const SizedBox.shrink(),
              ),
              AppInput(controller: _emailCtl, label: 'Email', hint: 'Enter your email', keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              AppInput(
                controller: _passwordCtl, label: 'Password', hint: 'Enter your password',
                obscureText: !_showPassword,
                suffix: IconButton(icon: Icon(_showPassword ? Icons.visibility : Icons.visibility_off, color: AppColors.onSurfaceVariant), onPressed: () => setState(() => _showPassword = !_showPassword)),
              ),
              const SizedBox(height: 24),
              AppButton(
                label: _isSignUp ? 'Create Account' : 'Sign In',
                onPressed: _submit,
                loading: state.status == AuthStatus.loading,
              ),
              if (state.error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.errorContainer.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(state.error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => setState(() => _isSignUp = !_isSignUp),
                child: Text(
                  _isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Join the Nexus",
                  style: const TextStyle(color: AppColors.primaryLight),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildVerify(AuthState state) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.mark_email_unread, size: 64, color: AppColors.primary),
        const SizedBox(height: 16),
        Text('Verify your email', style: AppTypography.headlineMd),
        const SizedBox(height: 8),
        Text('Enter the verification code sent to your email',
          style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        AppInput(controller: _codeCtl, hint: 'Enter 6-digit code', keyboardType: TextInputType.number),
        const SizedBox(height: 24),
        AppButton(
          label: 'Verify Email',
          onPressed: () => ref.read(authProvider.notifier).verifyEmail(_codeCtl.text),
          loading: state.status == AuthStatus.loading,
        ),
        if (state.error != null) ...[
          const SizedBox(height: 12),
          Text(state.error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
        ],
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => ref.read(authProvider.notifier).resendVerification(),
          child: const Text('Resend Code', style: TextStyle(color: AppColors.primaryLight)),
        ),
      ],
    );
  }
}
