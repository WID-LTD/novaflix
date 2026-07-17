import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

final _watchDetailsProvider = FutureProvider.family<MediaItem?, int>((ref, id) async {
  try {
    final api = ref.read(apiServiceProvider);
    final res = await api.getDetails(id, 'movie');
    return MediaItem.fromJson(res.data as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});

class WatchScreen extends ConsumerStatefulWidget {
  final int? movieId;
  final String? mediaType;
  final String? streamUrl;

  const WatchScreen({super.key, this.movieId, this.mediaType, this.streamUrl});

  @override
  ConsumerState<WatchScreen> createState() => _WatchScreenState();
}

class _WatchScreenState extends ConsumerState<WatchScreen> {
  bool _showQuality = false;
  bool _showEpisodes = false;
  String? _selectedQuality;
  double _progress = 0.0;

  @override
  Widget build(BuildContext context) {
    final details = widget.movieId != null ? ref.watch(_watchDetailsProvider(widget.movieId!)) : const AsyncValue.data(null);

    return Scaffold(
      backgroundColor: AppTheme.black,
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(),
            Expanded(child: _buildPlayerPlaceholder(details)),
            _buildControls(),
            if (_showQuality) _buildQualitySelector(),
            if (_showEpisodes) _buildEpisodeSelector(),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Row(
      children: [
        IconButton(icon: const Icon(Icons.arrow_back, color: AppTheme.white), onPressed: () => context.pop()),
        const Spacer(),
        IconButton(icon: const Icon(Icons.cast, color: AppTheme.white), onPressed: () {}),
      ],
    );
  }

  Widget _buildPlayerPlaceholder(AsyncValue<MediaItem?> details) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        color: AppTheme.dark,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppTheme.gray, width: 2)),
                child: const Icon(Icons.play_arrow, size: 48, color: AppTheme.white),
              ),
              const SizedBox(height: 16),
              details.whenOrNull(data: (m) => m != null ? Text(m.title, style: const TextStyle(color: AppTheme.white, fontSize: 16, fontWeight: FontWeight.w600)) : null) ?? const SizedBox(),
              const SizedBox(height: 4),
              Text(widget.streamUrl ?? 'Loading stream...', style: const TextStyle(color: AppTheme.gray, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildControls() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: AppTheme.red,
              inactiveTrackColor: AppTheme.darkGray,
              thumbColor: AppTheme.red,
              trackHeight: 3,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
            ),
            child: Slider(value: _progress, onChanged: (v) => setState(() => _progress = v)),
          ),
          Row(
            children: [
              Text('${_progressToString(_progress)} / ${_progressToString(1.0)}', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7), fontSize: 12)),
              const Spacer(),
              IconButton(icon: const Icon(Icons.volume_up, color: AppTheme.gray, size: 20), onPressed: () {}),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => setState(() => _showQuality = !_showQuality),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(4)),
                  child: Text(_selectedQuality ?? 'Auto', style: const TextStyle(color: AppTheme.white, fontSize: 12)),
                ),
              ),
              if (widget.mediaType == 'tv') ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => setState(() => _showEpisodes = !_showEpisodes),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(4)),
                    child: const Text('S1:E1', style: TextStyle(color: AppTheme.white, fontSize: 12)),
                  ),
                ),
              ],
              const SizedBox(width: 8),
              IconButton(icon: const Icon(Icons.fullscreen, color: AppTheme.gray, size: 20), onPressed: () {}),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQualitySelector() {
    const qualities = ['Auto', '1080p', '720p', '480p', '360p'];
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(8)),
      child: Column(
        children: qualities.map((q) => ListTile(
          dense: true,
          title: Text(q, style: TextStyle(color: _selectedQuality == q ? AppTheme.red : AppTheme.white)),
          trailing: _selectedQuality == q ? const Icon(Icons.check, color: AppTheme.red, size: 18) : null,
          onTap: () => setState(() { _selectedQuality = q; _showQuality = false; }),
        )).toList(),
      ),
    );
  }

  Widget _buildEpisodeSelector() {
    return Container(
      height: 200,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(8)),
      child: ListView.builder(
        itemCount: 10,
        itemBuilder: (_, i) => ListTile(
          dense: true,
          leading: Text('${i + 1}', style: const TextStyle(color: AppTheme.gray)),
          title: Text('Episode ${i + 1}', style: const TextStyle(color: AppTheme.white, fontSize: 14)),
          trailing: const Icon(Icons.play_arrow, color: AppTheme.gray, size: 18),
          onTap: () => setState(() => _showEpisodes = false),
        ),
      ),
    );
  }

  String _progressToString(double v) {
    final totalSeconds = (v * 3600).toInt();
    final m = (totalSeconds ~/ 60) % 60;
    final s = totalSeconds % 60;
    final h = totalSeconds ~/ 3600;
    if (h > 0) return '${h}h ${m.toString().padLeft(2, '0')}m';
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
}
