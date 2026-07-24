import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class CreatorCatalogScreen extends StatelessWidget {
  const CreatorCatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Content Catalog')),
      body: Center(child: Text('Catalog management coming soon', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant))),
    );
  }
}
