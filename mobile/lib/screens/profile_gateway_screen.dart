import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';

class ProfileGatewayScreen extends StatelessWidget {
  const ProfileGatewayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.play_circle_fill, size: 60, color: AppColors.primary),
              const SizedBox(height: 16),
              Text("Who's watching?", style: AppTypography.headlineMd),
              const SizedBox(height: 32),
              GestureDetector(
                onTap: () => context.go('/home'),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 48,
                      backgroundColor: AppColors.surfaceContainerHighest,
                      child: const Icon(Icons.person, size: 48, color: AppColors.onSurfaceVariant),
                    ),
                    const SizedBox(height: 8),
                    const Text('Default Profile', style: TextStyle(color: AppColors.onSurfaceVariant)),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              AppButton(label: 'Continue to Home', onPressed: () => context.go('/home')),
            ],
          ),
        ),
      ),
    );
  }
}
