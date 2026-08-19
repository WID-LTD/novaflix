import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

const _storage = FlutterSecureStorage();
const _watchlistKey = 'novaflix-watchlist';

class WatchlistItem {
  final int contentId;
  final String contentType;
  final String? title;
  final String? poster;
  final String? year;

  const WatchlistItem({
    required this.contentId,
    required this.contentType,
    this.title,
    this.poster,
    this.year,
  });

  factory WatchlistItem.fromJson(Map<String, dynamic> j) => WatchlistItem(
        contentId: int.tryParse(j['content_id']?.toString() ?? '') ?? 0,
        contentType: j['content_type'] as String? ?? 'movie',
        title: j['title'] as String?,
        poster: j['poster'] as String?,
        year: j['year'] as String?,
      );
}

class WatchlistState {
  final List<WatchlistItem> items;

  const WatchlistState({this.items = const []});

  bool isInWatchlist(int id, String type) =>
      items.any((i) => i.contentId == id && i.contentType == type);
}

class WatchlistNotifier extends StateNotifier<WatchlistState> {
  final ApiService _api;

  WatchlistNotifier(this._api) : super(const WatchlistState()) {
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _api.getWatchlist();
      final data = res.data;
      final list = (data['items'] as List? ?? [])
          .map((e) => WatchlistItem.fromJson(e as Map<String, dynamic>))
          .toList();
      state = WatchlistState(items: list);
      _saveLocal();
    } catch (_) {
      await _loadLocal();
    }
  }

  Future<void> _loadLocal() async {
    final raw = await _storage.read(key: _watchlistKey);
    if (raw != null) {
      try {
        final data = jsonDecode(raw) as List;
        state = WatchlistState(
          items: data.map((e) => WatchlistItem(
            contentId: e['contentId'] as int? ?? 0,
            contentType: e['contentType'] as String? ?? 'movie',
          )).toList(),
        );
      } catch (_) {}
    }
  }

  Future<void> _saveLocal() async {
    await _storage.write(key: _watchlistKey, value: jsonEncode(
      state.items.map((i) => {'contentId': i.contentId, 'contentType': i.contentType}).toList(),
    ));
  }

  Future<void> toggle(int id, String type, {String? title, String? poster, String? year}) async {
    if (state.isInWatchlist(id, type)) {
      state = WatchlistState(
        items: state.items.where((i) => !(i.contentId == id && i.contentType == type)).toList(),
      );
      _saveLocal();
      try { await _api.removeFromWatchlist(id.toString()); } catch (_) {}
    } else {
      state = WatchlistState(
        items: [...state.items, WatchlistItem(contentId: id, contentType: type, title: title, poster: poster, year: year)],
      );
      _saveLocal();
      try {
        await _api.addToWatchlist({
          'contentId': id,
          'contentType': type,
          'title': title,
          'poster': poster,
          'year': year,
        });
      } catch (_) {}
    }
  }
}

final watchlistProvider = StateNotifierProvider<WatchlistNotifier, WatchlistState>((ref) {
  final api = ref.read(apiServiceProvider);
  return WatchlistNotifier(api);
});
