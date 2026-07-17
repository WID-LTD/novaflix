import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
          child: SingleChildScrollView(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('NOVAFLIX', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.red, letterSpacing: 4)),
                      Row(
                        children: [
                          TextButton(onPressed: () => context.go('/login'), child: const Text('Sign In')),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => context.go('/register'),
                            style: ElevatedButton.styleFrom(minimumSize: const Size(100, 40)),
                            child: const Text('Get Started'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
                  child: Column(
                    children: [
                      const Text('Unlimited movies, TV shows & creator content', textAlign: TextAlign.center, style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: AppTheme.white, height: 1.2)),
                      const SizedBox(height: 16),
                      Text('Watch anywhere. Cancel anytime.', style: TextStyle(fontSize: 16, color: AppTheme.gray.withValues(alpha: 0.8))),
                      const SizedBox(height: 32),
                      SizedBox(width: double.infinity, height: 52, child: ElevatedButton(
                        onPressed: () => context.go('/register'),
                        child: const Text('Get Started', style: TextStyle(fontSize: 18)),
                      )),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
