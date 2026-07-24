import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class AdminFiltersScreen extends StatelessWidget {
  const AdminFiltersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Content Filters')),
      body: Center(child: Text('Filter management coming soon', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant))),
    );
  }
}
