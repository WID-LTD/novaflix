import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('404', style: TextStyle(
              fontSize: 96, fontWeight: FontWeight.w900,
              color: AppTheme.red.withValues(alpha: 0.3),
            )),
            const SizedBox(height: 16),
            const Text('Page not found', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: AppTheme.white)),
            const SizedBox(height: 8),
            Text('The page you\'re looking for doesn\'t exist', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => context.go('/'),
              style: ElevatedButton.styleFrom(minimumSize: const Size(200, 48)),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}
