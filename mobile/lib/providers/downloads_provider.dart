import 'dart:async';
import 'dart:io' show Platform;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/download_service.dart';
import '../services/api_service.dart';

/// Thrown/surfaced when the plan's download-device cap is hit (409).
class DownloadLimitReached {
  final String message;
  final int limit;
  DownloadLimitReached(this.message, {this.limit = 0});
}

/// Holds the persisted manifest of completed downloads and the list of
/// active in-flight downloads with live progress.
class DownloadsState {
  final List<DownloadItem> items;
  final List<ActiveDownload> active;
  final bool loading;
  final String? limitError;
  const DownloadsState({
    this.items = const [],
    this.active = const [],
    this.loading = false,
    this.limitError,
  });

  DownloadsState copyWith({
    List<DownloadItem>? items,
    List<ActiveDownload>? active,
    bool? loading,
    String? limitError,
    bool clearLimitError = false,
  }) =>
      DownloadsState(
        items: items ?? this.items,
        active: active ?? this.active,
        loading: loading ?? this.loading,
        limitError: clearLimitError ? null : (limitError ?? this.limitError),
      );
}

class DownloadsNotifier extends StateNotifier<DownloadsState> {
  DownloadsNotifier(this._service, this._api)
      : super(const DownloadsState(loading: true)) {
    _refresh();
  }

  final DownloadService _service;
  final ApiService _api;
  Timer? _ticker;

  Future<void> _refresh() async {
    final items = await _service.loadManifest();
    state = DownloadsState(
      items: items,
      active: List.unmodifiable(_service.activeDownloads),
      limitError: state.limitError,
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
          limitError: state.limitError,
        );
      }
    });
  }

  /// Registers this device against the per-plan download-device cap.
  /// Returns null when OK, or a [DownloadLimitReached] when at cap.
  Future<DownloadLimitReached?> registerDevice() async {
    try {
      String name = 'NovaFlix Device';
      try {
        name = '${Platform.isIOS ? 'iPhone' : 'Android'} · ${Platform.localHostname}';
      } catch (_) {}
      await _api.registerDownloadDevice(
        platform: Platform.isIOS ? 'ios' : 'android',
        deviceName: name,
      );
      state = state.copyWith(clearLimitError: true);
      return null;
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        final data = e.response?.data;
        final msg = (data is Map && data['error'] is String)
            ? data['error'] as String
            : 'Download device limit reached for your plan.';
        state = state.copyWith(limitError: msg);
        return DownloadLimitReached(msg);
      }
      // Registry unreachable — fail open so live users are never blocked.
      return null;
    } catch (_) {
      return null;
    }
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
    final limit = await registerDevice();
    if (limit != null) return; // capped — state.limitError carries the message
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

  void clearLimitError() {
    state = state.copyWith(clearLimitError: true);
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
  final api = ref.watch(apiServiceProvider);
  return DownloadsNotifier(service, api);
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
