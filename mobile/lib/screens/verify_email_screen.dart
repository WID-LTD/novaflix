import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';

class VerifyEmailScreen extends ConsumerWidget {
  const VerifyEmailScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final codeCtl = TextEditingController();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.mark_email_unread, size: 80, color: AppColors.primary),
                const SizedBox(height: 24),
                Text('Check Your Email', style: AppTypography.headlineMd),
                const SizedBox(height: 8),
                Text(
                  authState.pendingEmail != null
                      ? 'We sent a code to ${authState.pendingEmail}'
                      : 'Enter verification code',
                  style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                AppInput(
                  controller: codeCtl,
                  hint: 'Enter 6-digit code',
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: 'Verify Email',
                  onPressed: () => ref.read(authProvider.notifier).verifyEmail(codeCtl.text),
                  loading: authState.status == AuthStatus.loading,
                ),
                if (authState.error != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.errorContainer.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(authState.error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                  ),
                ],
                const SizedBox(height: 24),
                TextButton(
                  onPressed: () => ref.read(authProvider.notifier).resendVerification(),
                  child: const Text("Didn't get it? Resend", style: TextStyle(color: AppColors.primaryLight)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
