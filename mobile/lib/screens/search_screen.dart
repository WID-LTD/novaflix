import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchCtrl = TextEditingController();
  String _activeType = 'movie';
  List<MediaItem> _results = [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _search(String query) async {
    if (query.isEmpty) {
      setState(() { _results = []; _error = null; });
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.searchMedia(query, type: _activeType);
      final data = res.data as Map<String, dynamic>;
      final list = (data['results'] as List?) ?? [];
      setState(() {
        _results = list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(
        title: TextField(
          controller: _searchCtrl,
          autofocus: true,
          style: const TextStyle(color: AppTheme.white),
          decoration: const InputDecoration(
            hintText: 'Search movies & TV...',
            border: InputBorder.none,
            fillColor: Colors.transparent,
            filled: true,
          ),
          onChanged: _search,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () {
              _searchCtrl.clear();
              _search('');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Row(
            children: [
              _TypeTab(label: 'Movies', active: _activeType == 'movie', onTap: () {
                setState(() => _activeType = 'movie');
                _search(_searchCtrl.text);
              }),
              _TypeTab(label: 'TV Shows', active: _activeType == 'tv', onTap: () {
                setState(() => _activeType = 'tv');
                _search(_searchCtrl.text);
              }),
            ],
          ),
          const Divider(height: 1),
          Expanded(child: _buildResults()),
        ],
      ),
    );
  }

  Widget _buildResults() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text('Error: $_error', style: const TextStyle(color: AppTheme.gray)));
    if (_results.isEmpty) return Center(child: Text('Results appear here', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.6))));

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

class _TypeTab extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _TypeTab({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: active ? AppTheme.red : Colors.transparent, width: 2)),
          ),
          child: Text(label, textAlign: TextAlign.center, style: TextStyle(
            color: active ? AppTheme.white : AppTheme.gray,
            fontWeight: active ? FontWeight.w600 : FontWeight.normal,
          )),
        ),
      ),
    );
  }
}
