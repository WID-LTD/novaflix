import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../providers/store_provider.dart';
import '../widgets/ui/index.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _nameCtl = TextEditingController();
  final _bioCtl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameCtl.text = user?.username ?? '';
  }

  @override
  void dispose() {
    _nameCtl.dispose();
    _bioCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final store = ref.watch(storeProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _section('Account', [
            AppInput(controller: _nameCtl, label: 'Display Name'),
            const SizedBox(height: 12),
            Text('Email: ${user?.email ?? ''}', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 12),
            AppButton(label: 'Save Profile', onPressed: () {}, loading: false),
          ]),
          const SizedBox(height: 24),
          _section('Subscription', [
            ListTile(
              leading: const Icon(Icons.card_membership, color: AppColors.primary),
              title: Text('Current Plan: ${user?.plan ?? 'Free'}'),
              subtitle: const Text('Tap to upgrade', style: TextStyle(color: AppColors.onSurfaceVariant)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/pricing'),
            ),
          ]),
          const SizedBox(height: 24),
          _section('Playback', [
            ListTile(
              leading: const Icon(Icons.settings, color: AppColors.primary),
              title: const Text('Default Quality'),
              subtitle: Text(store.playbackSettings.defaultQuality),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
            SwitchListTile(
              secondary: const Icon(Icons.play_circle, color: AppColors.primary),
              title: const Text('Autoplay'),
              value: store.playbackSettings.autoplay,
              onChanged: (v) {
                ref.read(storeProvider.notifier).updatePlaybackSettings(
                  store.playbackSettings.copyWith(autoplay: v),
                );
              },
            ),
          ]),
          const SizedBox(height: 24),
          _section('Notifications', [
            SwitchListTile(
              secondary: const Icon(Icons.movie, color: AppColors.primary),
              title: const Text('New Releases'),
              value: store.notificationSettings.newReleases,
              onChanged: (v) {
                ref.read(storeProvider.notifier).updateNotificationSettings(
                  store.notificationSettings.copyWith(newReleases: v),
                );
              },
            ),
            SwitchListTile(
              secondary: const Icon(Icons.bookmark, color: AppColors.primary),
              title: const Text('Watchlist Updates'),
              value: store.notificationSettings.watchlistUpdates,
              onChanged: (v) {
                ref.read(storeProvider.notifier).updateNotificationSettings(
                  store.notificationSettings.copyWith(watchlistUpdates: v),
                );
              },
            ),
          ]),
          const SizedBox(height: 24),
          _section('Your Library', [
            _linkTile(Icons.bookmark, 'Watchlist', () => context.push('/watchlist')),
            _linkTile(Icons.person, 'Profile', () => context.push('/profile')),
            _linkTile(Icons.play_circle, 'Continue Watching', () => context.push('/home')),
          ]),
          if (user?.isCreator ?? false) ...[
            const SizedBox(height: 24),
            _section('Creator Tools', [
              _linkTile(Icons.dashboard, 'Dashboard', () => context.push('/creator')),
              _linkTile(Icons.upload, 'Upload', () => context.push('/upload')),
              _linkTile(Icons.store, 'Store', () => context.push('/store')),
              _linkTile(Icons.school, 'Courses', () => context.push('/learn')),
            ]),
          ],
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTypography.headlineSm),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _linkTile(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
      onTap: onTap,
    );
  }
}
