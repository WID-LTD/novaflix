import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class ProfileGatewayScreen extends StatelessWidget {
  const ProfileGatewayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('NOVAFLIX', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: AppTheme.red, letterSpacing: 6)),
            const SizedBox(height: 48),
            const Text('Who\'s watching?', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w600, color: AppTheme.white)),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _ProfileAvatar(initial: 'U', onTap: () => context.go('/home')),
                const SizedBox(width: 24),
                _ProfileAvatar(initial: '+', onTap: () {}),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  final String initial;
  final VoidCallback onTap;
  const _ProfileAvatar({required this.initial, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          CircleAvatar(
            radius: 44,
            backgroundColor: AppTheme.card,
            child: Text(initial, style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w300, color: AppTheme.gray)),
          ),
          const SizedBox(height: 8),
          Text(initial == '+' ? 'Add Profile' : 'User', style: const TextStyle(color: AppTheme.gray, fontSize: 14)),
        ],
      ),
    );
  }
}
