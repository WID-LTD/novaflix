import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  String _type = 'movie';
  int? _genreId;
  List<MediaItem> _results = [];
  List<Genre> _genres = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final genreRes = await api.getGenres(type: _type);
      final genreData = genreRes.data as Map<String, dynamic>;
      setState(() {
        _genres = ((genreData['genres'] as List?) ?? []).map((e) => Genre.fromJson(e as Map<String, dynamic>)).toList();
      });
      await _search();
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _search() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      if (_genreId != null) {
        final res = await api.getCategoryMovies(_genreId!, type: _type);
        final data = res.data as Map<String, dynamic>;
        final list = (data['results'] as List?) ?? [];
        setState(() {
          _results = list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
          _loading = false;
        });
      } else {
        final res = await api.searchMedia('', type: _type);
        final data = res.data as Map<String, dynamic>;
        final list = (data['results'] as List?) ?? [];
        setState(() {
          _results = list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Discover')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: _DropdownButton<String>(
                    value: _type,
                    items: const ['movie', 'tv'],
                    labels: const ['Movies', 'TV Shows'],
                    onChanged: (v) { setState(() => _type = v!); _load(); },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DropdownButton<int?>(
                    value: _genreId,
                    items: [null, ..._genres.map((g) => g.id)],
                    labels: ['All Genres', ..._genres.map((g) => g.name)],
                    onChanged: (v) { setState(() => _genreId = v); _search(); },
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(child: _buildGrid()),
        ],
      ),
    );
  }

  Widget _buildGrid() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_results.isEmpty) return Center(child: Text('No results', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.6))));

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.65,
      ),
      itemCount: _results.length,
      itemBuilder: (context, i) {
        final item = _results[i];
        final path = '/${item.mediaType == 'tv' ? 'tv' : 'movie'}/${item.id}';
        return GestureDetector(
          onTap: () => context.go(path),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: item.posterUrl != null
                ? CachedNetworkImage(imageUrl: item.posterUrl!, fit: BoxFit.cover)
                : Container(color: AppTheme.card, child: const Icon(Icons.movie, color: AppTheme.gray)),
          ),
        );
      },
    );
  }
}

class _DropdownButton<T> extends StatelessWidget {
  final T value;
  final List<T> items;
  final List<String> labels;
  final ValueChanged<T?> onChanged;

  const _DropdownButton({required this.value, required this.items, required this.labels, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          dropdownColor: AppTheme.card,
          style: const TextStyle(color: AppTheme.white, fontSize: 14),
          items: List.generate(items.length, (i) => DropdownMenuItem(value: items[i], child: Text(labels[i]))),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
