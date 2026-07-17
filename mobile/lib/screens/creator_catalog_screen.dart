import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CreatorCatalogScreen extends StatelessWidget {
  const CreatorCatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Content Catalog')),
      body: const Center(child: Text('Catalog management coming soon', style: TextStyle(color: AppTheme.gray))),
    );
  }
}
