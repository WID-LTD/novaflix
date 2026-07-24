import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class LandingScreen extends ConsumerWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              height: MediaQuery.of(context).size.height,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.primary.withValues(alpha: 0.1),
                    AppColors.background,
                  ],
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.play_circle_fill, size: 100, color: AppColors.primary),
                    const SizedBox(height: 24),
                    ShaderMask(
                      shaderCallback: (bounds) => LinearGradient(
                        colors: [AppColors.primary, AppColors.secondary],
                      ).createShader(bounds),
                      child: Text('NOVAFLIX', style: AppTypography.displayMd.copyWith(color: Colors.white, letterSpacing: 8, fontWeight: FontWeight.w900)),
                    ),
                    const SizedBox(height: 16),
                    Text('Stream. Create. Connect.',
                      style: AppTypography.bodyLg.copyWith(color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: 48),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      child: Column(
                        children: [
                          ElevatedButton(
                            onPressed: () => context.push('/login'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(double.infinity, 52),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Get Started', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton(
                            onPressed: () => context.push('/login'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              minimumSize: const Size(double.infinity, 52),
                              side: const BorderSide(color: Colors.white30),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Sign In', style: TextStyle(fontSize: 18)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
