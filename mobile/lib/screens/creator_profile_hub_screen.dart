import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class CreatorProfileHubScreen extends StatelessWidget {
  const CreatorProfileHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Creator Profile')),
      body: Center(child: Text('Profile management coming soon', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant))),
    );
  }
}
