import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CreatorAnalyticsScreen extends StatelessWidget {
  const CreatorAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Creator Analytics')),
      body: const Center(child: Text('Detailed analytics coming soon', style: TextStyle(color: AppTheme.gray))),
    );
  }
}
