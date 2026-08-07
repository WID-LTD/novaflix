import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _referralProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final statsRes = await api.getAffiliateStats();
    return statsRes.data['stats'] as Map<String, dynamic>?;
  } catch (_) { return null; }
});

final _codeProvider = FutureProvider<String?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.generateReferral();
    return res.data['code'] as String? ?? res.data['url'] as String?;
  } catch (_) { return null; }
});

class ReferralsScreen extends ConsumerWidget {
  const ReferralsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(_referralProvider);
    final codeAsync = ref.watch(_codeProvider);
    final code = codeAsync.valueOrNull;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Referrals')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 16),
            Icon(Icons.share, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('Refer Friends, Get Rewards', style: AppTypography.headlineMd),
            const SizedBox(height: 8),
            Text('Share your referral code with friends and earn rewards when they join.',
              style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Your Code', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(code ?? '------', style: AppTypography.headlineSm.copyWith(letterSpacing: 2)),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: code != null ? () {} : null,
                    icon: const Icon(Icons.copy, color: AppColors.primary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            stats.when(
              data: (s) {
                if (s == null) return const SizedBox();
                return Row(
                  children: [
                    _statBox('${s['total'] ?? 0}', 'Total'),
                    _statBox('${s['converted'] ?? 0}', 'Converted'),
                    _statBox('\$${(s['total_commission'] as num?)?.toStringAsFixed(2) ?? '0.00'}', 'Commission'),
                  ],
                );
              },
              loading: () => const LoadingSpinner(logo: true),
              error: (_, __) => const SizedBox(),
            ),
            const SizedBox(height: 32),
            AppButton(label: 'Share Now', onPressed: () {}),
          ],
        ),
      ),
    );
  }

  Widget _statBox(String value, String label) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value, style: AppTypography.headlineSm),
            Text(label, style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
