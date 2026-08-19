import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/creator.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _publicCreatorsProvider = FutureProvider<List<Creator>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getPublicCreators();
  final data = res.data['creators'] as List? ?? res.data['data'] as List? ?? [];
  return data.map((e) => Creator.fromJson(e as Map<String, dynamic>)).toList();
});

class CreatorsScreen extends ConsumerWidget {
  const CreatorsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final creators = ref.watch(_publicCreatorsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Creators')),
      body: creators.when(
        data: (items) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: gridColumnsFor(
              MediaQuery.sizeOf(context).width,
            ).clamp(2, 4),
            childAspectRatio: 0.9,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: items.length,
          itemBuilder: (_, i) {
            final creator = items[i];
            return Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppColors.surfaceContainerHighest,
                    backgroundImage: creator.avatarUrl != null
                        ? CachedNetworkImageProvider(creator.avatarUrl!)
                        : null,
                    child: creator.avatarUrl == null
                        ? const Icon(Icons.person, size: 36, color: Colors.grey)
                        : null,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    creator.username,
                    style: AppTypography.bodyMd.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (creator.department != null)
                    Text(
                      creator.department!,
                      style: TextStyle(
                        color: AppColors.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  Text(
                    '${creator.filmCount} films',
                    style: const TextStyle(
                      color: AppColors.onSurfaceVariant,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
