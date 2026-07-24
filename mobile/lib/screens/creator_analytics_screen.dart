import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class CreatorAnalyticsScreen extends StatelessWidget {
  const CreatorAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Creator Analytics')),
      body: Center(child: Text('Detailed analytics coming soon', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant))),
    );
  }
}
