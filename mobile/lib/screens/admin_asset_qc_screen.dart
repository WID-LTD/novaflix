import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/ui/index.dart';

class AdminAssetQCScreen extends StatelessWidget {
  const AdminAssetQCScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Asset QC')),
      body: const ComingSoonView(
        icon: Icons.fact_check,
        title: 'Asset QC',
        description: 'Asset quality control dashboard coming soon',
      ),
    );
  }
}
