import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/ui/index.dart';

class CreatorAnalyticsScreen extends StatelessWidget {
  const CreatorAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Creator Analytics')),
      body: const ComingSoonView(
        icon: Icons.analytics,
        title: 'Creator Analytics',
        description: 'Detailed analytics and insights coming soon',
      ),
    );
  }
}
