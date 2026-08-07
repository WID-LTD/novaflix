import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:media_kit/media_kit.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../models/media_item.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/video_player.dart';

final _watchDetailsProvider = FutureProvider.family<MediaItem?, int>((ref, id) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getDetails(id, 'movie');
    final data = res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
    return MediaItem.fromJson(data);
  } catch (_) {
    return null;
  }
});

final _sourceProvider = FutureProvider.family<Map<String, dynamic>, ({int id, String type, int? season, int? episode})>(
  (ref, args) async {
    final api = ref.read(apiServiceProvider);
    final res = await api.getStreamSource(args.id, args.type, season: args.season, episode: args.episode);
    return res.data is Map<String, dynamic> ? (res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>) : <String, dynamic>{};
  },
);

class WatchScreen extends ConsumerWidget {
  final int? movieId;
  final String? mediaType;
  final String? streamUrl;
  final String? season;
  final String? episode;

  const WatchScreen({
    super.key,
    this.movieId,
    this.mediaType,
    this.streamUrl,
    this.season,
    this.episode,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (movieId == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(title: const Text('Watch'), backgroundColor: Colors.black),
        body: const Center(child: Text('No media selected', style: TextStyle(color: Colors.white))),
      );
    }

    final type = mediaType ?? 'movie';
    final detail = ref.watch(_watchDetailsProvider(movieId!));
    final source = ref.watch(_sourceProvider((id: movieId!, type: type, season: int.tryParse(season ?? ''), episode: int.tryParse(episode ?? ''))));
    final authState = ref.watch(authProvider);
    final isFreeTier = !(authState.user?.isPremium ?? false);

    final streamUrlResolved = streamUrl ?? (source.valueOrNull?['streamUrl'] as String? ?? '');
    final episodeInfo = episode != null ? 'S${season} E$episode' : null;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: AppBackButton(),
        title: detail.when(
          data: (item) => Text(item?.title ?? 'Watch', style: const TextStyle(fontSize: 16)),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Watch'),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: source.when(
                loading: () => Padding(
                  padding: const EdgeInsets.all(24),
                  child: SizedBox(
                    height: 200,
                    child: Center(child: LoadingSpinner(logo: true, size: 40)),
                  ),
                ),
                error: (e, _) => _buildError(context, e.toString()),
                data: (src) {
                  final url = streamUrl ?? src['streamUrl'] as String? ?? '';
                  if (url.isEmpty) {
                    return _buildError(context, 'Could not load video source');
                  }
                  return Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        VideoPlayer(
                          streamUrl: url,
                          title: episodeInfo != null ? '${detail.valueOrNull?.title} - $episodeInfo' : detail.valueOrNull?.title,
                          isFreeTier: isFreeTier,
                          onProgress: (_) {},
                          onDuration: (_) {},
                        ),
                        const SizedBox(height: 12),
                        if (episodeInfo != null)
                          Text(episodeInfo, style: TextStyle(color: AppColors.onSurfaceVariant)),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError(BuildContext context, String message) {
    return Container(
      color: Colors.black,
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.info, color: Colors.redAccent, size: 48),
          const SizedBox(height: 12),
          const Text('Stream unavailable', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text(message, style: const TextStyle(color: Colors.white54), textAlign: TextAlign.center),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FilledButton(
                onPressed: () => context.go('/watch?id=$movieId&type=$mediaType${season != null ? '&season=$season' : ''}${episode != null ? '&episode=$episode' : ''}'),
                style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                child: const Text('Retry'),
              ),
              const SizedBox(width: 12),
              TextButton(
                onPressed: () => context.pop(),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}