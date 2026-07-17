import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _codeCtrl = TextEditingController();

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);

    ref.listen<AuthState>(authProvider, (prev, next) {
      if (next.status == AuthStatus.unauthenticated && prev?.status == AuthStatus.loading) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Email verified! Please sign in.')),
        );
        context.go('/login');
      }
    });

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.black, AppTheme.dark, AppTheme.black],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                children: [
                  const Icon(Icons.mark_email_unread, size: 64, color: AppTheme.red),
                  const SizedBox(height: 24),
                  Text('Verify Your Email', style: TextStyle(
                    fontSize: 24, fontWeight: FontWeight.w600,
                    color: AppTheme.white.withValues(alpha: 0.9),
                  )),
                  const SizedBox(height: 12),
                  Text(
                    state.pendingEmail != null
                        ? 'Enter the verification code sent to ${state.pendingEmail}'
                        : 'Enter the verification code sent to your email',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.gray, fontSize: 14),
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: _codeCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Verification Code',
                      prefixIcon: Icon(Icons.pin_outlined, color: AppTheme.gray),
                    ),
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => ref.read(authProvider.notifier).verifyEmail(_codeCtrl.text.trim()),
                  ),
                  const SizedBox(height: 24),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(state.error!, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
                    ),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: state.status == AuthStatus.loading
                          ? null
                          : () => ref.read(authProvider.notifier).verifyEmail(_codeCtrl.text.trim()),
                      child: state.status == AuthStatus.loading
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.white))
                          : const Text('Verify'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => ref.read(authProvider.notifier).resendVerification(),
                    child: const Text('Resend Code'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
