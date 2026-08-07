import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/features/index.dart';
import '../widgets/ui/index.dart';

final _hooksProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getHooksFeed();
  final data = res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class HooksFeedScreen extends ConsumerWidget {
  const HooksFeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hooks = ref.watch(_hooksProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Hooks')),
      body: hooks.when(
        data: (items) => items.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.videocam, size: 64, color: AppColors.onSurfaceVariant),
              const SizedBox(height: 16),
              Text('No hooks available', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            ]))
          : PageView.builder(
            scrollDirection: Axis.vertical,
            itemCount: items.length,
            itemBuilder: (_, i) {
              final hook = items[i];
              return Container(
                color: Colors.black,
                child: Stack(
                  children: [
                    if (hook['videoUrl'] != null)
                      Positioned.fill(child: Image.network(hook['videoUrl'], fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey[900])))
                    else
                      const Positioned.fill(child: Center(child: Icon(Icons.videocam, size: 64, color: Colors.grey))),
                    Positioned(
                      left: 16, right: 16, bottom: 60,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (hook['title'] != null) Text(hook['title'].toString(), style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          if (hook['year'] != null) Text(hook['year'].toString(), style: const TextStyle(color: Colors.white70, fontSize: 14)),
                        ],
                      ),
                    ),
                    Positioned(
                      right: 12, bottom: 120,
                      child: Column(
                        children: [
                          LikeButton(contentId: i, contentType: 'hook'),
                        ],
                      ),
                    ),
                    Positioned(
                      top: 8, right: 8,
                      child: Text('${i + 1} / ${items.length}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                    ),
                  ],
                ),
              );
            },
          ),
        loading: () => const LoadingSpinner(logo: true),
        error: (e, _) => Center(child: Text('Error: $e', style: TextStyle(color: AppColors.error))),
      ),
    );
  }
}
