import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();
const _watchlistKey = 'novaflix-watchlist';

class WatchlistState {
  final List<int> movieIds;
  final List<int> tvIds;

  const WatchlistState({this.movieIds = const [], this.tvIds = const []});

  bool isInWatchlist(int id, String type) =>
      type == 'movie' ? movieIds.contains(id) : tvIds.contains(id);

  WatchlistState toggle(int id, String type) {
    if (type == 'movie') {
      return WatchlistState(
        movieIds: movieIds.contains(id) ? movieIds.where((x) => x != id).toList() : [...movieIds, id],
        tvIds: tvIds,
      );
    }
    return WatchlistState(
      movieIds: movieIds,
      tvIds: tvIds.contains(id) ? tvIds.where((x) => x != id).toList() : [...tvIds, id],
    );
  }
}

class WatchlistNotifier extends StateNotifier<WatchlistState> {
  WatchlistNotifier() : super(const WatchlistState()) { _load(); }

  Future<void> _load() async {
    final raw = await _storage.read(key: _watchlistKey);
    if (raw != null) {
      try {
        final data = jsonDecode(raw) as Map<String, dynamic>;
        state = WatchlistState(
          movieIds: (data['movies'] as List?)?.cast<int>() ?? [],
          tvIds: (data['tv'] as List?)?.cast<int>() ?? [],
        );
      } catch (_) {}
    }
  }

  Future<void> _save() async {
    await _storage.write(key: _watchlistKey, value: jsonEncode({
      'movies': state.movieIds, 'tv': state.tvIds,
    }));
  }

  void toggle(int id, String type) { state = state.toggle(id, type); _save(); }
}

final watchlistProvider = StateNotifierProvider<WatchlistNotifier, WatchlistState>((ref) {
  return WatchlistNotifier();
});
