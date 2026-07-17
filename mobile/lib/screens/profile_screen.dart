import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(authProvider);
    final user = state.user;

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 32),
            CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.card,
              child: Icon(
                user?.avatar != null ? Icons.person : Icons.person,
                size: 48,
                color: AppTheme.red,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user?.username ?? 'User',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.white),
            ),
            Text(
              user?.email ?? '',
              style: const TextStyle(color: AppTheme.gray, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: user?.isCreator == true ? AppTheme.red.withValues(alpha: 0.2) : AppTheme.card,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                user?.role.toUpperCase() ?? 'USER',
                style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w600,
                  color: user?.isCreator == true ? AppTheme.red : AppTheme.gray,
                ),
              ),
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () {
                  ref.read(authProvider.notifier).logout();
                  context.go('/login');
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.red,
                  side: const BorderSide(color: AppTheme.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
