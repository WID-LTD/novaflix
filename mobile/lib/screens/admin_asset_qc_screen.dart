import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class AdminAssetQCScreen extends StatelessWidget {
  const AdminAssetQCScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Asset QC')),
      body: Center(child: Text('Asset quality control coming soon', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant))),
    );
  }
}
