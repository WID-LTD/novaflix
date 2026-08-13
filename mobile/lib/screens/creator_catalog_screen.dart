import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/ui/index.dart';

class CreatorCatalogScreen extends StatelessWidget {
  const CreatorCatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Content Catalog')),
      body: const ComingSoonView(
        icon: Icons.video_library,
        title: 'Content Catalog',
        description: 'Manage your content catalog',
      ),
    );
  }
}
