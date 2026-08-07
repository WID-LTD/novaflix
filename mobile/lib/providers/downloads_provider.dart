import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/download_service.dart';

/// Holds the persisted manifest of completed downloads and the list of
/// active in-flight downloads with live progress.
class DownloadsState {
  final List<DownloadItem> items;
  final List<ActiveDownload> active;
  final bool loading;
  const DownloadsState({
    this.items = const [],
    this.active = const [],
    this.loading = false,
  });

  DownloadsState copyWith({
    List<DownloadItem>? items,
    List<ActiveDownload>? active,
    bool? loading,
  }) =>
      DownloadsState(
        items: items ?? this.items,
        active: active ?? this.active,
        loading: loading ?? this.loading,
      );
}

class DownloadsNotifier extends StateNotifier<DownloadsState> {
  DownloadsNotifier(this._service) : super(const DownloadsState(loading: true)) {
    _refresh();
  }

  final DownloadService _service;
  Timer? _ticker;

  Future<void> _refresh() async {
    final items = await _service.loadManifest();
    state = DownloadsState(
      items: items,
      active: List.unmodifiable(_service.activeDownloads),
    );
    _startTicker();
  }

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(milliseconds: 300), (_) {
      if (_service.activeDownloads.isNotEmpty) {
        state = DownloadsState(
          items: state.items,
          active: List.unmodifiable(_service.activeDownloads),
        );
      }
    });
  }

  Future<void> startDownload({
    required int contentId,
    required String type,
    required String title,
    String? poster,
    String? backdrop,
    int? season,
    int? episode,
    List<Map<String, dynamic>>? episodes,
  }) async {
    try {
      await _service.downloadContent(
        contentId: contentId,
        type: type,
        title: title,
        poster: poster,
        backdrop: backdrop,
        season: season,
        episode: episode,
        episodes: episodes,
      );
    } finally {
      await _refresh();
    }
  }

  void cancelDownloads() {
    _service.cancelActive();
  }

  Future<void> remove(DownloadItem item) async {
    await _service.deleteDownload(item);
    await _refresh();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }
}

final downloadsProvider =
    StateNotifierProvider<DownloadsNotifier, DownloadsState>((ref) {
  final service = ref.watch(downloadServiceProvider);
  return DownloadsNotifier(service);
});

/// Connectivity tracking so the app can detect offline mode.
enum NetStatus { unknown, online, offline }

class NetStatusNotifier extends StateNotifier<NetStatus> {
  NetStatusNotifier() : super(NetStatus.unknown) {
    _init();
  }

  Future<void> _init() async {
    _sync(await Connectivity().checkConnectivity());
    Connectivity().onConnectivityChanged.listen(_sync);
  }

  void _sync(List<ConnectivityResult> results) {
    if (results.contains(ConnectivityResult.none)) {
      state = NetStatus.offline;
    } else {
      state = NetStatus.online;
    }
  }
}

final netStatusProvider =
    StateNotifierProvider<NetStatusNotifier, NetStatus>((ref) => NetStatusNotifier());
