import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/api_service.dart';
import '../models/creator.dart';
import '../theme/app_theme.dart';

final _publicCreatorsProvider = FutureProvider<List<Creator>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getPublicCreators();
  final list = res.data as List;
  return list.map((e) => Creator.fromJson(e as Map<String, dynamic>)).toList();
});

class CreatorsScreen extends ConsumerWidget {
  const CreatorsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final creators = ref.watch(_publicCreatorsProvider);

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Creators')),
      body: creators.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.gray))),
        data: (list) => list.isEmpty
            ? const Center(child: Text('No creators yet', style: TextStyle(color: AppTheme.gray)))
            : GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.75,
                ),
                itemCount: list.length,
                itemBuilder: (context, i) {
                  final c = list[i];
                  return GestureDetector(
                    onTap: () {},
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.card,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundColor: AppTheme.darkGray,
                            backgroundImage: c.avatarUrl != null ? CachedNetworkImageProvider(c.avatarUrl!) : null,
                            child: c.avatarUrl == null ? const Icon(Icons.person, size: 36, color: AppTheme.gray) : null,
                          ),
                          const SizedBox(height: 12),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Text(c.username, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.white, fontWeight: FontWeight.w600, fontSize: 14)),
                          ),
                          if (c.department != null) Text(c.department!, style: const TextStyle(color: AppTheme.gray, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text('${c.filmCount} films', style: const TextStyle(color: AppTheme.red, fontSize: 11, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
