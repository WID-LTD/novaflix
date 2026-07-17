import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HooksFeedScreen extends StatelessWidget {
  const HooksFeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Hooks')),
      body: const Center(child: Text('Short-form video feed coming soon', style: TextStyle(color: AppTheme.gray))),
    );
  }
}
