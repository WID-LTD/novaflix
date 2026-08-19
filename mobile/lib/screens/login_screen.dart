import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/config.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../widgets/features/index.dart';
import '../widgets/ui/index.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.redirect});

  final String? redirect;

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
      ref
          .read(authProvider.notifier)
          .register(email, password, _nameCtl.text.trim());
    } else {
      ref.read(authProvider.notifier).login(email, password);
    }
  }

  void _toggleMode() {
    setState(() => _isSignUp = !_isSignUp);
    ref.read(authProvider.notifier).clearError();
  }

  Future<void> _googleSignIn() async {
    final redirect = Uri.encodeComponent('/home');
    final url = '${AppConfig.apiBaseUrl}/auth/google?redirect=$redirect';
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isVerify = authState.status == AuthStatus.needsVerification;
    final isLoginVerify = authState.status == AuthStatus.needsLoginVerification;

    if (authState.status == AuthStatus.authenticated) {
      final redirect = widget.redirect;
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.go(
          redirect != null && redirect.isNotEmpty ? redirect : '/home',
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          const Positioned.fill(child: LoginBackdrop()),
          SafeArea(
            child: Center(
              child: ScrollConfiguration(
                behavior: ScrollConfiguration.of(
                  context,
                ).copyWith(scrollbars: false),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 48,
                  ),
                  child: isVerify
                      ? _buildVerify(authState)
                      : isLoginVerify
                      ? _buildLoginVerify(authState)
                      : _buildAuth(authState),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAuth(AuthState state) {
    final maxWidth = MediaQuery.sizeOf(context).width;
    final logoWidth = (maxWidth * 0.9).clamp(200.0, 800.0);

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 480),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset(
            'assets/brand/leter-mark-logo.png',
            width: logoWidth,
            height: logoWidth / 2,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const SizedBox(height: 120),
          ),
          const SizedBox(height: 4),
          Text(
            'The Cinematic Experience',
            style: AppTypography.labelXs.copyWith(
              color: AppColors.onSurfaceVariant.withValues(alpha: 0.7),
              letterSpacing: 2,
              fontSize: 11,
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -64),
            child: _formCard(state),
          ),
          const SizedBox(height: 32),
          _statusRow(),
        ],
      ),
    );
  }

  Widget _formCard(AuthState state) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back',
            style: AppTypography.headlineLg.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _isSignUp
                ? 'Create your account to begin your journey.'
                : 'Sign in to your portal to resume discovery.',
            style: AppTypography.bodyMd.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 20),
          if (state.error != null) _errorBanner(state.error!),
          const SizedBox(height: 20),
          AnimatedSize(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            child: _isSignUp
                ? Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: AppInput(
                      controller: _nameCtl,
                      label: 'Display Name',
                      hint: 'Your name',
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          AppInput(
            controller: _emailCtl,
            label: 'Email Address',
            hint: 'name@email.com',
            icon: Icons.alternate_email,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          _passwordField(state),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              label: _isSignUp ? 'Create Account' : 'Sign In',
              onPressed: _submit,
              loading: state.status == AuthStatus.loading,
            ),
          ),
          const SizedBox(height: 28),
          _divider(),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _socialButton(
                  icon: Icons.g_mobiledata,
                  label: 'Google',
                  onTap: _googleSignIn,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _socialButton(
                  icon: Icons.apple,
                  label: 'Apple',
                  onTap: () {},
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    _isSignUp ? 'Already have an account?' : 'New to ',
                    style: AppTypography.bodyMd.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ),
                if (!_isSignUp)
                  Image.asset(
                    'assets/brand/leter-mark-logo.png',
                    height: 14,
                    fit: BoxFit.contain,
                  ),
                if (!_isSignUp)
                  Text(
                    '?',
                    style: AppTypography.bodyMd.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                TextButton(
                  onPressed: _toggleMode,
                  child: Text(
                    _isSignUp ? 'Sign In' : 'Join the Nexus',
                    style: const TextStyle(
                      color: AppColors.primaryContainer,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _passwordField(AuthState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text('Password', style: AppTypography.labelMd)),
            if (!_isSignUp)
              TextButton(
                onPressed: () => context.push('/forgot-password'),
                child: const Text(
                  'Forgot Password?',
                  style: TextStyle(
                    color: AppColors.primaryContainer,
                    fontSize: 12,
                  ),
                ),
              ),
          ],
        ),
        AppInput(
          controller: _passwordCtl,
          hint: _isSignUp ? 'Create a password' : 'Enter your password',
          obscureText: !_showPassword,
          suffix: IconButton(
            icon: Icon(
              _showPassword ? Icons.visibility_off : Icons.visibility,
              color: AppColors.onSurfaceVariant,
              size: 20,
            ),
            onPressed: () => setState(() => _showPassword = !_showPassword),
          ),
        ),
      ],
    );
  }

  Widget _errorBanner(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.errorContainer.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: AppColors.error, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() {
    return Row(
      children: [
        Expanded(
          child: Divider(
            color: AppColors.outlineVariant.withValues(alpha: 0.2),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'OR CONTINUE WITH',
            style: AppTypography.labelXs.copyWith(
              color: AppColors.onSurfaceVariant.withValues(alpha: 0.5),
              fontSize: 10,
              letterSpacing: 1,
            ),
          ),
        ),
        Expanded(
          child: Divider(
            color: AppColors.outlineVariant.withValues(alpha: 0.2),
          ),
        ),
      ],
    );
  }

  Widget _socialButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        backgroundColor: AppColors.surfaceContainerHigh,
        foregroundColor: AppColors.onSurface,
        side: BorderSide(
          color: AppColors.outlineVariant.withValues(alpha: 0.2),
        ),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Text(label, style: AppTypography.labelMd),
        ],
      ),
    );
  }

  Widget _statusRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(
          width: 6,
          height: 6,
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.secondary,
              boxShadow: [BoxShadow(color: Color(0x9953E076), blurRadius: 8)],
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'System Operational',
          style: AppTypography.labelSm.copyWith(color: AppColors.onSurface),
        ),
        const SizedBox(width: 24),
        const Icon(Icons.lock_outline, size: 14, color: AppColors.onSurface),
        const SizedBox(width: 6),
        Text(
          'Encrypted Portal',
          style: AppTypography.labelSm.copyWith(color: AppColors.onSurface),
        ),
      ],
    );
  }

  Widget _buildVerify(AuthState state) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 440),
      child: _verifyCard(
        icon: Icons.mark_email_unread,
        title: 'Verify your email',
        message: '6-digit code sent to ${state.pendingEmail ?? ''}',
        buttonLabel: 'Verify Email',
        onVerify: () =>
            ref.read(authProvider.notifier).verifyEmail(_codeCtl.text),
        onResend: () => ref.read(authProvider.notifier).resendVerification(),
        state: state,
      ),
    );
  }

  Widget _buildLoginVerify(AuthState state) {
    final email = state.pendingEmail ?? '';
    final reason = state.loginVerifyReason ?? 'new-device';
    String message;
    switch (reason) {
      case 'new-device':
        message =
            'We noticed a sign-in from a new device or network. A code was sent to $email.';
        break;
      case 'inactive':
        message =
            "You haven't signed in for a while, so we want to confirm it's you. A code was sent to $email.";
        break;
      case 'unknown-location':
        message =
            'We noticed a sign-in from an unfamiliar location. A code was sent to $email.';
        break;
      default:
        message = 'A code was sent to $email.';
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 440),
      child: _verifyCard(
        icon: Icons.verified_user,
        title: 'Confirm it\'s you',
        message: message,
        buttonLabel: 'Verify & Sign In',
        onVerify: () =>
            ref.read(authProvider.notifier).loginVerify(_codeCtl.text),
        onResend: () {
          final userId = state.pendingUserId;
          if (userId != null) {
            ref.read(authProvider.notifier).resendVerification();
          }
        },
        state: state,
      ),
    );
  }

  Widget _verifyCard({
    required IconData icon,
    required String title,
    required String message,
    required String buttonLabel,
    required VoidCallback onVerify,
    required VoidCallback onResend,
    required AuthState state,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 24),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, size: 56, color: AppColors.primary),
          const SizedBox(height: 16),
          Text(title, style: AppTypography.headlineMd),
          const SizedBox(height: 8),
          Text(
            message,
            style: AppTypography.bodyMd.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _codeCtl,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.onSurface,
              fontSize: 24,
              fontWeight: FontWeight.bold,
              letterSpacing: 8,
            ),
            decoration: InputDecoration(
              counterText: '',
              hintText: '000000',
              hintStyle: TextStyle(
                color: AppColors.onSurfaceVariant.withValues(alpha: 0.4),
                fontSize: 24,
                letterSpacing: 8,
              ),
              filled: true,
              fillColor: AppColors.surfaceContainerLow,
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: AppColors.outlineVariant.withValues(alpha: 0.3),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.primaryContainer),
              ),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              label: buttonLabel,
              onPressed: _codeCtl.text.length == 6 ? onVerify : null,
              loading: state.status == AuthStatus.loading,
            ),
          ),
          if (state.error != null) ...[
            const SizedBox(height: 12),
            Text(
              state.error!,
              style: const TextStyle(color: AppColors.error, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: 8),
          TextButton(
            onPressed: onResend,
            child: const Text(
              'Resend code',
              style: TextStyle(color: AppColors.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }
}
