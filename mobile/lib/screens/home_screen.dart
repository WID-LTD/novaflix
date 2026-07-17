import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

final trendingProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getTrending();
  final data = res.data as Map<String, dynamic>;
  final list = data['results'] as List;
  return list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final popularProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getNowPlaying();
  final data = res.data as Map<String, dynamic>;
  final list = data['results'] as List;
  return list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trending = ref.watch(trendingProvider);
    final popular = ref.watch(popularProvider);

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(
        title: const Text('NOVAFLIX', style: TextStyle(
          color: AppTheme.red, fontWeight: FontWeight.w900, letterSpacing: 4,
        )),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _showSearch(context, ref),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            trending.when(
              data: (movies) => _MovieCarousel(
                title: 'Trending Now',
                movies: movies,
                onTap: (m) => context.go('/movie/${m.id}'),
              ),
              loading: () => const _LoadingCarousel(),
              error: (e, _) => Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Failed to load: $e', style: const TextStyle(color: AppTheme.gray)),
              ),
            ),
            const SizedBox(height: 16),
            popular.when(
              data: (movies) => _MovieCarousel(
                title: 'Popular',
                movies: movies,
                onTap: (m) => context.go('/movie/${m.id}'),
              ),
              loading: () => const _LoadingCarousel(),
              error: (e, _) => Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Failed to load: $e', style: const TextStyle(color: AppTheme.gray)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showSearch(BuildContext context, WidgetRef ref) {
    showSearch(context: context, delegate: _MovieSearchDelegate(ref));
  }
}

class _MovieCarousel extends StatelessWidget {
  final String title;
  final List<MediaItem> movies;
  final void Function(MediaItem) onTap;

  const _MovieCarousel({required this.title, required this.movies, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Text(title, style: const TextStyle(
            fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.white,
          )),
        ),
        SizedBox(
          height: 200,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: movies.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final movie = movies[i];
              return GestureDetector(
                onTap: () => onTap(movie),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 130,
                    child: movie.posterUrl != null
                        ? CachedNetworkImage(
                            imageUrl: movie.posterUrl!,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: AppTheme.card),
                            errorWidget: (context, url, error) => Container(
                              color: AppTheme.card,
                              child: const Icon(Icons.movie, color: AppTheme.gray),
                            ),
                          )
                        : Container(
                            color: AppTheme.card,
                            child: const Icon(Icons.movie, color: AppTheme.gray),
                          ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _LoadingCarousel extends StatelessWidget {
  const _LoadingCarousel();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Container(width: 140, height: 22, decoration: BoxDecoration(
            color: AppTheme.card, borderRadius: BorderRadius.circular(4),
          )),
        ),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: 5,
            itemBuilder: (context, index) => Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Container(
                width: 130, decoration: BoxDecoration(
                  color: AppTheme.card, borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MovieSearchDelegate extends SearchDelegate {
  final WidgetRef ref;
  _MovieSearchDelegate(this.ref);

  @override
  List<Widget>? buildActions(BuildContext context) => [
    IconButton(icon: const Icon(Icons.clear), onPressed: () => query = ''),
  ];

  @override
  Widget? buildLeading(BuildContext context) => IconButton(
    icon: const Icon(Icons.arrow_back), onPressed: () => close(context, null),
  );

  @override
  Widget buildResults(BuildContext context) => _buildSearchResults(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildSearchResults(context);

  Widget _buildSearchResults(BuildContext context) {
    if (query.isEmpty) {
      return const Center(child: Text('Type to search', style: TextStyle(color: AppTheme.gray)));
    }

    return FutureBuilder(
      future: ref.read(apiServiceProvider).searchMedia(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: AppTheme.gray)));
        }

        final response = snapshot.data as dynamic;
        if (response == null) return const SizedBox();
        final data = response.data as Map<String, dynamic>;

        final results = (data['results'] as List?)?.map((e) {
          return MediaItem.fromJson(e as Map<String, dynamic>);
        }).toList() ?? [];

        if (results.isEmpty) {
          return const Center(child: Text('No results', style: TextStyle(color: AppTheme.gray)));
        }

        return ListView.builder(
          itemCount: results.length,
          itemBuilder: (context, i) {
            final media = results[i];
            return ListTile(
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: SizedBox(
                  width: 50, height: 70,
                  child: media.posterUrl != null
                      ? CachedNetworkImage(imageUrl: media.posterUrl!, fit: BoxFit.cover)
                      : Container(color: AppTheme.card, child: const Icon(Icons.movie, size: 24, color: AppTheme.gray)),
                ),
              ),
              title: Text(media.title, style: const TextStyle(color: AppTheme.white)),
              subtitle: Text(media.releaseDate ?? '', style: const TextStyle(color: AppTheme.gray, fontSize: 12)),
              onTap: () {
                close(context, null);
                context.go('/movie/${media.id}');
              },
            );
          },
        );
      },
    );
  }
}
