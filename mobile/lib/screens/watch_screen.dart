import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../models/media_item.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

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

class WatchScreen extends ConsumerWidget {
  final int? movieId;
  final String? mediaType;
  final String? streamUrl;

  const WatchScreen({super.key, this.movieId, this.mediaType, this.streamUrl});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (movieId == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(title: const Text('Watch'), backgroundColor: Colors.black),
        body: const Center(child: Text('No media selected', style: TextStyle(color: Colors.white))),
      );
    }

    final detail = ref.watch(_watchDetailsProvider(movieId!));

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: detail.when(
          data: (item) => Text(item?.title ?? 'Watch', style: const TextStyle(fontSize: 16)),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Watch'),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Container(
              color: Colors.black,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white30, width: 3),
                      ),
                      child: const Icon(Icons.play_arrow, color: Colors.white, size: 48),
                    ),
                    const SizedBox(height: 16),
                    const Text('Video Player', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ),
          Container(
            color: AppColors.surfaceContainer,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.volume_up, color: Colors.white70, size: 20),
                    Expanded(
                      child: Slider(
                        value: 0.5,
                        onChanged: (_) {},
                        activeColor: AppColors.primary,
                        inactiveColor: Colors.white24,
                      ),
                    ),
                    const Icon(Icons.fullscreen, color: Colors.white70, size: 20),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _controlButton(Icons.skip_previous, 'Previous'),
                    _controlButton(Icons.replay_10, 'Replay'),
                    _controlButton(Icons.pause_circle_filled, 'Pause', size: 48),
                    _controlButton(Icons.forward_30, 'Forward'),
                    _controlButton(Icons.skip_next, 'Next'),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('Quality: Auto', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const Spacer(),
                    const Text('S01 E01', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _controlButton(IconData icon, String label, {double size = 28}) {
    return GestureDetector(
      onTap: () {},
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: size),
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10)),
        ],
      ),
    );
  }
}
