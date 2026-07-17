import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CreatorProfileHubScreen extends StatelessWidget {
  const CreatorProfileHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Creator Profile')),
      body: const Center(child: Text('Profile management coming soon', style: TextStyle(color: AppTheme.gray))),
    );
  }
}
