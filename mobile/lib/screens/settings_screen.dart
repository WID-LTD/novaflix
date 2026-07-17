import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionHeader(title: 'Account'),
          _SettingTile(icon: Icons.person_outline, title: 'Profile', subtitle: state.user?.email, onTap: () {}),
          _SettingTile(icon: Icons.subscriptions_outlined, title: 'Subscription', subtitle: 'Free Plan', onTap: () => context.go('/pricing')),
          const Divider(height: 32, color: AppTheme.darkGray),
          _SectionHeader(title: 'Preferences'),
          _SettingTile(icon: Icons.language, title: 'Language', subtitle: 'English', onTap: () {}),
          _SettingTile(icon: Icons.dark_mode, title: 'Appearance', subtitle: 'Dark Mode', onTap: () {}),
          const Divider(height: 32, color: AppTheme.darkGray),
          _SectionHeader(title: 'Playback'),
          _SettingTile(icon: Icons.high_quality, title: 'Default Quality', subtitle: 'Auto', onTap: () {}),
          _SettingTile(icon: Icons.subtitles, title: 'Subtitle Language', subtitle: 'English', onTap: () {}),
          _SettingTile(icon: Icons.autorenew, title: 'Autoplay', subtitle: 'On', onTap: () {}),
          const Divider(height: 32, color: AppTheme.darkGray),
          _SectionHeader(title: 'Notifications'),
          _SettingTile(icon: Icons.notifications_outlined, title: 'Push Notifications', subtitle: 'Enabled', onTap: () {}),
          const Divider(height: 32, color: AppTheme.darkGray),
          _SectionHeader(title: 'About'),
          _SettingTile(icon: Icons.info_outline, title: 'Version', subtitle: '1.0.0', onTap: () {}),
          _SettingTile(icon: Icons.description_outlined, title: 'Terms of Service', onTap: () {}),
          _SettingTile(icon: Icons.privacy_tip_outlined, title: 'Privacy Policy', onTap: () {}),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: const TextStyle(
        fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.red, letterSpacing: 1,
      )),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  const _SettingTile({required this.icon, required this.title, this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppTheme.gray),
      title: Text(title, style: const TextStyle(color: AppTheme.white)),
      subtitle: subtitle != null ? Text(subtitle!, style: const TextStyle(color: AppTheme.gray, fontSize: 12)) : null,
      trailing: const Icon(Icons.chevron_right, color: AppTheme.gray, size: 20),
      onTap: onTap,
    );
  }
}
