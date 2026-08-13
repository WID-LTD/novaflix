import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/ui/index.dart';

class AdminFiltersScreen extends StatelessWidget {
  const AdminFiltersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Content Filters')),
      body: const ComingSoonView(
        icon: Icons.tune,
        title: 'Content Filters',
        description: 'Manage content filtering rules coming soon',
      ),
    );
  }
}
