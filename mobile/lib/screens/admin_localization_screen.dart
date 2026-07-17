import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AdminLocalizationScreen extends StatelessWidget {
  const AdminLocalizationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Localization')),
      body: const Center(child: Text('Localization settings coming soon', style: TextStyle(color: AppTheme.gray))),
    );
  }
}
