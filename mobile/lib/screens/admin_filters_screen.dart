import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AdminFiltersScreen extends StatelessWidget {
  const AdminFiltersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Content Filters')),
      body: const Center(child: Text('Filter management coming soon', style: TextStyle(color: AppTheme.gray))),
    );
  }
}
