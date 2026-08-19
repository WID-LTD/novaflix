import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';

class PaymentSuccessScreen extends ConsumerWidget {
  const PaymentSuccessScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final route = GoRouterState.of(context);
    final reference = route.uri.queryParameters['reference'] ?? '';
    final plan = route.uri.queryParameters['plan'] ?? '';

    final verify = ref.watch(FutureProvider((_) async {
      if (reference.isEmpty) return 'no_reference';
      final api = ref.read(apiServiceProvider);
      try {
        await api.verifyPayment(reference, plan);
        ref.read(authProvider.notifier).refreshUser();
        return 'success';
      } catch (e) {
        return 'error:$e';
      }
    }));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: verify.when(
            data: (status) {
              if (status == 'success' || status == 'no_reference') {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle, size: 80, color: Colors.green),
                    const SizedBox(height: 24),
                    Text('Payment Successful!', style: AppTypography.headlineMd),
                    const SizedBox(height: 8),
                    Text('Your transaction has been completed.',
                      style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: () => context.go('/home'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      ),
                      child: const Text('Continue Watching'),
                    ),
                  ],
                );
              }
              final error = status.replaceFirst('error:', '');
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error, size: 80, color: AppColors.error),
                  const SizedBox(height: 24),
                  Text('Verification Failed', style: AppTypography.headlineMd),
                  const SizedBox(height: 8),
                  Text(error, style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => context.go('/pricing'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                    child: const Text('Try Again'),
                  ),
                ],
              );
            },
            loading: () => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const LoadingSpinner(),
                const SizedBox(height: 24),
                Text('Verifying Payment...', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
              ],
            ),
            error: (e, _) => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error, size: 80, color: AppColors.error),
                const SizedBox(height: 16),
                Text('Error: $e', style: TextStyle(color: AppColors.error)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
