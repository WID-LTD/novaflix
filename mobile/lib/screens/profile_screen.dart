import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../providers/store_provider.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final store = ref.watch(storeProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.surfaceContainerHighest,
                    child: Icon(Icons.person, size: 50, color: AppColors.onSurfaceVariant),
                  ),
                  const SizedBox(height: 12),
                  Text(user?.username ?? 'User', style: AppTypography.headlineMd),
                  const SizedBox(height: 4),
                  Text(user?.email ?? '', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  if (user?.isPremium ?? false)
                    const PremiumBadge()
                  else
                    AppButton(
                      label: 'Upgrade to Premium',
                      onPressed: () => context.push('/pricing'),
                      fullWidth: false,
                      height: 36,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            _section('Stats', [
              _statCard(Icons.bookmark, 'Watchlist', '${store.continueWatching.length} items'),
              _statCard(Icons.play_circle, 'Continue Watching', '${store.continueWatching.length} items'),
            ]),
            const SizedBox(height: 24),
            _section('Quick Links', [
              _linkTile(Icons.settings, 'Settings', () => context.push('/settings')),
              _linkTile(Icons.bookmark, 'Watchlist', () => context.push('/watchlist')),
              _linkTile(Icons.download, 'Downloads', () => context.push('/downloads')),
              _linkTile(Icons.star, 'Pricing', () => context.push('/pricing')),
            ]),
            const SizedBox(height: 24),
            if (user?.isCreator ?? false) ...[
              _section('Creator Tools', [
                _linkTile(Icons.dashboard, 'Dashboard', () => context.push('/creator')),
                _linkTile(Icons.upload, 'Upload', () => context.push('/upload')),
                _linkTile(Icons.store, 'Store', () => context.push('/store')),
              ]),
              const SizedBox(height: 24),
            ],
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Sign Out'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTypography.headlineSm),
        const SizedBox(height: 12),
        ...children,
      ],
    );
  }

  Widget _statCard(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 24),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: AppTypography.bodyMd)),
          Text(value, style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _linkTile(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
      onTap: onTap,
      dense: true,
    );
  }
}
