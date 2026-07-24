import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';

class MovieListScreen extends StatelessWidget {
  final List<Map<String, dynamic>>? items;
  final String? title;

  const MovieListScreen({super.key, this.items, this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: title != null ? AppBar(title: Text(title!)) : null,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.movie_creation, size: 48, color: AppColors.onSurfaceVariant),
            const SizedBox(height: 16),
            Text('Movie list coming soon', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}
