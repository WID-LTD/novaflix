import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AdminAssetQCScreen extends StatelessWidget {
  const AdminAssetQCScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Asset QC')),
      body: const Center(child: Text('Asset quality control coming soon', style: TextStyle(color: AppTheme.gray))),
    );
  }
}
