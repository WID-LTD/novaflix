import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/ui/index.dart';

class AdminLocalizationScreen extends StatelessWidget {
  const AdminLocalizationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Localization')),
      body: const ComingSoonView(
        icon: Icons.translate,
        title: 'Localization',
        description: 'Translation and localization settings coming soon',
      ),
    );
  }
}
