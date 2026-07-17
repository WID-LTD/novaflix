import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WatchPartyScreen extends StatelessWidget {
  const WatchPartyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Watch Party')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.groups, size: 64, color: AppTheme.gray),
              const SizedBox(height: 24),
              const Text('Watch Together', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.white)),
              const SizedBox(height: 8),
              Text('Sync videos and chat in real-time', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () {},
                        child: const Text('Create Party'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.white,
                          side: const BorderSide(color: AppTheme.gray),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('Join Party'),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
