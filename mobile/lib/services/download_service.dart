import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../services/api_service.dart';

const _magic = 'NFLX'; // custom container magic bytes
const _version = 1;
const _chunkSize = 64 * 1024; // AES block aligned chunking

// Server-enforced limits — 100MB per file at lowest quality, 300MB total for 1 movie + 2 TV episodes
const int kMaxBytesPerFile = 100 * 1024 * 1024; // 100 MB
const int kMaxTotalBytes = 300 * 1024 * 1024; // 300 MB

class DownloadEpisode {
  final int season;
  final int episode;
  final String name;
  final String fileName; // encrypted file name (relative path)
  final double progress;
  final double duration;
  const DownloadEpisode({
    required this.season,
    required this.episode,
    required this.name,
    required this.fileName,
    this.progress = 0,
    this.duration = 0,
  });

  Map<String, dynamic> toJson() => {
        'season': season,
        'episode': episode,
        'name': name,
        'fileName': fileName,
        'progress': progress,
        'duration': duration,
      };

  factory DownloadEpisode.fromJson(Map<String, dynamic> j) => DownloadEpisode(
        season: j['season'] as int? ?? 1,
        episode: j['episode'] as int? ?? 1,
        name: j['name'] as String? ?? '',
        fileName: j['fileName'] as String? ?? '',
        progress: (j['progress'] as num?)?.toDouble() ?? 0,
        duration: (j['duration'] as num?)?.toDouble() ?? 0,
      );
}

class DownloadItem {
  final int id;
  final String type; // movie | tv
  final String title;
  final String? poster;
  final String? backdrop;
  final DateTime addedAt;
  final double progress; // aggregate 0..1
  final double duration;
  final bool completed;
  final List<DownloadEpisode> episodes; // empty for movies
  const DownloadItem({
    required this.id,
    required this.type,
    required this.title,
    this.poster,
    this.backdrop,
    required this.addedAt,
    this.progress = 0,
    this.duration = 0,
    this.completed = false,
    this.episodes = const [],
  });

  bool get isTv => type == 'tv';

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'title': title,
        'poster': poster,
        'backdrop': backdrop,
        'addedAt': addedAt.millisecondsSinceEpoch,
        'progress': progress,
        'duration': duration,
        'completed': completed,
        'episodes': episodes.map((e) => e.toJson()).toList(),
      };

  factory DownloadItem.fromJson(Map<String, dynamic> j) => DownloadItem(
        id: j['id'] as int? ?? 0,
        type: j['type'] as String? ?? 'movie',
        title: j['title'] as String? ?? '',
        poster: j['poster'] as String?,
        backdrop: j['backdrop'] as String?,
        addedAt: DateTime.fromMillisecondsSinceEpoch(j['addedAt'] as int? ?? 0),
        progress: (j['progress'] as num?)?.toDouble() ?? 0,
        duration: (j['duration'] as num?)?.toDouble() ?? 0,
        completed: j['completed'] as bool? ?? false,
        episodes: (j['episodes'] as List? ?? [])
            .map((e) => DownloadEpisode.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class ActiveDownload {
  final int contentId;
  final String type;
  final String title;
  final String? poster;
  final String? backdrop;
  final int episodeCount;
  int episodesDone;
  double totalBytes;
  double bytesDone;
  bool cancelled = false;
  ActiveDownload({
    required this.contentId,
    required this.type,
    required this.title,
    this.poster,
    this.backdrop,
    required this.episodeCount,
    required this.episodesDone,
    required this.totalBytes,
    required this.bytesDone,
  });

  double get fraction =>
      totalBytes <= 0 ? 0 : (bytesDone / totalBytes).clamp(0.0, 1.0);
}

class DownloadSizeEstimate {
  final int estimatedBytes;
  final String label;
  final String variantUrl;
  final String resolution;
  final bool withinLimit;
  const DownloadSizeEstimate({
    required this.estimatedBytes,
    required this.label,
    required this.variantUrl,
    required this.resolution,
    required this.withinLimit,
  });
}

class DownloadService {
  DownloadService(this._api);

  final ApiService _api;

  final List<ActiveDownload> _active = [];

  Directory? _cachedRoot;

  Future<Directory> _root() async {
    final dir = await getApplicationSupportDirectory();
    final d = Directory(p.join(dir.path, 'novaflix_downloads'));
    if (!await d.exists()) await d.create(recursive: true);
    return d;
  }

  Future<File> _manifestFile() async {
    final root = await _root();
    return File(p.join(root.path, 'manifest.json'));
  }

  Future<List<DownloadItem>> loadManifest() async {
    final f = await _manifestFile();
    if (!await f.exists()) return [];
    try {
      final raw = await f.readAsString();
      final list = jsonDecode(raw) as List? ?? [];
      return list
          .map((e) => DownloadItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _saveManifest(List<DownloadItem> items) async {
    final f = await _manifestFile();
    await f.writeAsString(jsonEncode(items.map((e) => e.toJson()).toList()));
  }

  Future<int> getTotalDownloadedBytes() async {
    final root = await _root();
    if (!await root.exists()) return 0;
    var total = 0;
    await for (final e in root.list(recursive: true)) {
      if (e is File && e.path.endsWith('.nfv')) {
        try {
          total += await e.length();
        } catch (_) {}
      }
    }
    return total;
  }

  Future<void> updateItemProgress(int id, String type, {required double progress, required double duration}) async {
    final items = await loadManifest();
    final idx = items.indexWhere((x) => x.id == id && x.type == type);
    if (idx < 0) return;
    final old = items[idx];
    final updated = DownloadItem(
      id: old.id,
      type: old.type,
      title: old.title,
      poster: old.poster,
      backdrop: old.backdrop,
      addedAt: old.addedAt,
      progress: progress,
      duration: duration,
      completed: old.completed,
      episodes: old.episodes,
    );
    items[idx] = updated;
    await _saveManifest(items);
  }

  Future<void> updateEpisodeProgress(int id, String type, int season, int episode, {required double progress, required double duration}) async {
    final items = await loadManifest();
    final idx = items.indexWhere((x) => x.id == id && x.type == type);
    if (idx < 0) return;
    final old = items[idx];
    final eps = old.episodes.map((e) {
      if (e.season == season && e.episode == episode) {
        return DownloadEpisode(
          season: e.season,
          episode: e.episode,
          name: e.name,
          fileName: e.fileName,
          progress: progress,
          duration: duration,
        );
      }
      return e;
    }).toList();
    items[idx] = DownloadItem(
      id: old.id,
      type: old.type,
      title: old.title,
      poster: old.poster,
      backdrop: old.backdrop,
      addedAt: old.addedAt,
      progress: old.progress,
      duration: old.duration,
      completed: old.completed,
      episodes: eps,
    );
    await _saveManifest(items);
  }

  /// Get estimated size at lowest quality (184p) — uses server manifestInfo with aggressive 0.30 ratio.
  /// Returns null if unable to estimate (e.g., no TMDB runtime).
  Future<DownloadSizeEstimate?> getSizeEstimate({
    required int id,
    required String type,
    int? season,
    int? episode,
  }) async {
    try {
      final src = await _resolveSource(id, type, season: season, episode: episode);
      final res = await _api.getDownloadManifest(
        url: src,
        id: id,
        type: type,
        season: season,
        episode: episode,
      );
      final raw = res.data as Map<String, dynamic>;
      // Server returns {success:true, duration, variants:[...]} or wrapped in data
      final data = raw['data'] is Map<String, dynamic> ? raw['data'] as Map<String, dynamic> : raw;
      final variants = (data['variants'] as List? ?? raw['variants'] as List? ?? []) as List;
      if (variants.isEmpty) return null;
      // variants sorted low→high; lowest is first
      final lowest = variants.first as Map<String, dynamic>;
      final bytes = (lowest['compressedBytes'] as int? ?? lowest['sizeBytes'] as int? ?? 0);
      final label = (lowest['compressedLabel'] as String? ?? lowest['sizeLabel'] as String? ?? 'Unknown');
      final url = (lowest['url'] as String? ?? src);
      final resStr = (lowest['resolution'] as String? ?? '320x184');
      return DownloadSizeEstimate(
        estimatedBytes: bytes,
        label: label,
        variantUrl: url,
        resolution: resStr,
        withinLimit: bytes == 0 || bytes <= kMaxBytesPerFile,
      );
    } catch (_) {
      return null;
    }
  }

  /// Check if we can download given estimated bytes without exceeding per-file or total limits.
  Future<String?> canDownload(int estimatedBytes) async {
    if (estimatedBytes > kMaxBytesPerFile) {
      return 'This title at lowest quality is ~${_formatBytes(estimatedBytes)} — exceeds 100 MB per-file limit. Try a shorter title or enable extra compression.';
    }
    final total = await getTotalDownloadedBytes();
    if (total + estimatedBytes > kMaxTotalBytes) {
      return 'Storage limit: you have ${_formatBytes(total)} used. Adding this (~${_formatBytes(estimatedBytes)}) would exceed 300 MB total (1 movie + 2 episodes). Delete a download first.';
    }
    if (total + estimatedBytes > kMaxTotalBytes * 0.9) {
      // Warn but allow — server will enforce
    }
    return null;
  }

  String _formatBytes(int bytes) {
    if (bytes <= 0) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    var size = bytes.toDouble();
    var i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return '${size.toStringAsFixed(1)} ${units[i]}';
  }

  /// Download a movie (single file) or a TV show (one file per episode).
  /// Uses server download endpoint which enforces 100MB/file + lowest quality (184p) + device caps.
  Future<void> downloadContent({
    required int contentId,
    required String type,
    required String title,
    String? poster,
    String? backdrop,
    int? season,
    int? episode,
    List<Map<String, dynamic>>? episodes,
    bool compress = true,
  }) async {
    if (type == 'tv' && (episodes == null || episodes.isEmpty)) return;
    final epList = episodes ?? const <Map<String, dynamic>>[];

    // Pre-flight storage check for 3-file scenario
    if (type == 'movie') {
      final est = await getSizeEstimate(id: contentId, type: 'movie');
      if (est != null) {
        final err = await canDownload(est.estimatedBytes);
        if (err != null) throw Exception(err);
      }
    }

    if (type == 'movie') {
      final source = await _resolveSource(contentId, 'movie');
      if (source.isEmpty) throw Exception('No playable stream found. Try again later.');
      // Final size check via manifest
      final est = await _getEstimateForUrl(source, id: contentId, type: 'movie');
      if (est != null) {
        final err = await canDownload(est.estimatedBytes);
        if (err != null) throw Exception(err);
      }
      final active = ActiveDownload(
        contentId: contentId,
        type: 'movie',
        title: title,
        poster: poster,
        backdrop: backdrop,
        episodeCount: 1,
        episodesDone: 0,
        totalBytes: (est?.estimatedBytes.toDouble() ?? 1),
        bytesDone: 0,
      );
      _active.add(active);
      try {
        await _downloadUrlToEncrypted(
          sourceUrl: source,
          relPath: 'movie_$contentId/$contentId.nfv',
          onProgress: (done) {
            active.bytesDone = done;
            active.totalBytes = math.max(active.totalBytes, done);
          },
          active: active,
          title: title,
          id: contentId,
          type: 'movie',
          compress: compress,
        );
      } catch (e) {
        _active.remove(active);
        if (e is DioException && e.response?.statusCode == 413) {
          final msg = (e.response?.data?['error'] as String?) ?? 'File exceeds 100 MB at lowest quality. Enable compression.';
          throw Exception(msg);
        }
        rethrow;
      }
      _active.remove(active);
      final list = await loadManifest();
      list.removeWhere((x) => x.id == contentId && x.type == 'movie');
      list.add(DownloadItem(
        id: contentId,
        type: 'movie',
        title: title,
        poster: poster,
        backdrop: backdrop,
        addedAt: DateTime.now(),
        progress: 1,
        completed: true,
      ));
      await _saveManifest(list);
      return;
    }

    // TV show: folder structure `tv_<id>/S<season>E<ep>.nfv`
    final items = await loadManifest();
    items.removeWhere((x) => x.id == contentId && x.type == 'tv');
    final dlEpisodes = <DownloadEpisode>[];
    final total = epList.length;
    // Pre-check total size for all episodes
    var totalEst = 0;
    for (final ep in epList) {
      final s = ep['season'] as int? ?? season ?? 1;
      final e = ep['episode'] as int? ?? 1;
      final est = await getSizeEstimate(id: contentId, type: 'tv', season: s, episode: e);
      if (est != null) totalEst += est.estimatedBytes;
    }
    if (totalEst > 0) {
      final err = await canDownload(totalEst);
      if (err != null) throw Exception(err);
    }

    final active = ActiveDownload(
      contentId: contentId,
      type: 'tv',
      title: title,
      poster: poster,
      backdrop: backdrop,
      episodeCount: total,
      episodesDone: 0,
      totalBytes: totalEst > 0 ? totalEst.toDouble() : total.toDouble(),
      bytesDone: 0,
    );
    _active.add(active);
    for (var i = 0; i < epList.length; i++) {
      final ep = epList[i];
      final s = ep['season'] as int? ?? season ?? 1;
      final e = ep['episode'] as int? ?? (i + 1);
      String src;
      try {
        src = await _resolveSource(contentId, 'tv', season: s, episode: e);
      } catch (_) {
        continue;
      }
      if (src.isEmpty) continue;
      if (active.cancelled) break;
      final fileName =
          'S${s.toString().padLeft(2, '0')}E${e.toString().padLeft(2, '0')}.nfv';
      try {
        await _downloadUrlToEncrypted(
          sourceUrl: src,
          relPath: 'tv_$contentId/$fileName',
          onProgress: (_) {
            active.episodesDone = i;
          },
          active: active,
          title: title,
          id: contentId,
          type: 'tv',
          season: s,
          episode: e,
          compress: compress,
        );
      } on DioException catch (ex) {
        if (ex.response?.statusCode == 413) {
          // Skip this episode but continue others — surface via exception after loop
          continue;
        }
        continue;
      } catch (_) {
        continue;
      }
      dlEpisodes.add(DownloadEpisode(
        season: s,
        episode: e,
        name: ep['name']?.toString() ?? 'Episode $e',
        fileName: 'tv_$contentId/$fileName',
      ));
      active.episodesDone = i + 1;
      active.bytesDone += 1; // approximate
      await _saveManifest([
        ...items,
        DownloadItem(
          id: contentId,
          type: 'tv',
          title: title,
          poster: poster,
          backdrop: backdrop,
          addedAt: DateTime.now(),
          completed: false,
          episodes: List.from(dlEpisodes),
        ),
      ]);
      // Enforce 100MB per episode already via server; extra client total check
      final curTotal = await getTotalDownloadedBytes();
      if (curTotal > kMaxTotalBytes) {
        throw Exception('Total storage would exceed 300 MB (1 movie + 2 episodes). Delete a download first.');
      }
    }
    _active.remove(active);
    final finalList = await loadManifest();
    finalList.removeWhere((x) => x.id == contentId && x.type == 'tv');
    finalList.add(DownloadItem(
      id: contentId,
      type: 'tv',
      title: title,
      poster: poster,
      backdrop: backdrop,
      addedAt: DateTime.now(),
      completed: true,
      episodes: List.from(dlEpisodes),
    ));
    await _saveManifest(finalList);
  }

  Future<DownloadSizeEstimate?> _getEstimateForUrl(String url, {required int id, required String type}) async {
    try {
      final res = await _api.getDownloadManifest(url: url, id: id, type: type);
      final data = res.data as Map<String, dynamic>;
      final variants = (data['variants'] as List? ?? []) as List;
      if (variants.isEmpty) return null;
      final lowest = variants.first as Map<String, dynamic>;
      return DownloadSizeEstimate(
        estimatedBytes: (lowest['compressedBytes'] as int? ?? 0),
        label: (lowest['compressedLabel'] as String? ?? ''),
        variantUrl: (lowest['url'] as String? ?? url),
        resolution: (lowest['resolution'] as String? ?? ''),
        withinLimit: (lowest['compressedBytes'] as int? ?? 0) <= kMaxBytesPerFile,
      );
    } catch (_) {
      return null;
    }
  }

  Future<String> _resolveSource(int id, String type, {int? season, int? episode}) async {
    try {
      final res = await _api.getStreamSource(id, type, season: season, episode: episode);
      final data = res.data is Map<String, dynamic>
          ? res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>
          : <String, dynamic>{};
      final url = data['directUrl'] as String? ?? data['streamUrl'] as String? ?? '';
      if (url.isEmpty) {
        final error = data['error'] as String? ?? 'No playable stream found for this title.';
        throw Exception(error);
      }
      return url;
    } catch (e) {
      rethrow;
    }
  }

  /// Stream via server download endpoint (enforces 100MB/file, lowest quality, compress) and encrypt chunk-by-chunk.
  Future<void> _downloadUrlToEncrypted({
    required String sourceUrl,
    required String relPath,
    required void Function(double bytesDone) onProgress,
    required ActiveDownload active,
    String? title,
    int? id,
    String? type,
    int? season,
    int? episode,
    bool compress = true,
  }) async {
    final key = await _deriveKey();
    final iv = _randomIv();
    final encrypter = enc.Encrypter(
      enc.AES(enc.Key(Uint8List.fromList(key)), mode: enc.AESMode.cbc),
    );
    try {
      // Use server download endpoint which handles lowest quality + 100MB enforcement + device caps
      final stream = await _api.streamDownload(
        url: sourceUrl,
        title: title,
        compress: compress,
        id: id,
        type: type,
        season: season,
        episode: episode,
      );
      final header = _buildHeader(iv);
      final root = await _root();
      final f = File(p.join(root.path, relPath));
      if (await f.exists()) await f.delete();
      await f.parent.create(recursive: true);
      final out = f.openWrite();

      out.add(header);

      var done = 0;
      await for (final chunk in stream) {
        if (active.cancelled) {
          await out.flush();
          await out.close();
          await f.delete();
          return;
        }
        final data = chunk is List<int> ? Uint8List.fromList(chunk) : chunk;
        var offset = 0;
        while (offset < data.length) {
          final end = math.min(offset + _chunkSize, data.length);
          final slice = Uint8List.sublistView(data, offset, end);
          final encIv = enc.IV(iv);
          final cipher = encrypter.encryptBytes(slice, iv: encIv);
          out.add(cipher.bytes);
          offset = end;
        }
        done += data.length;
        // Enforce 100MB per file client-side as safety (in case server somehow streams larger)
        if (done > kMaxBytesPerFile) {
          await out.flush();
          await out.close();
          await f.delete();
          throw Exception('Download exceeded 100 MB limit at lowest quality — cancelled.');
        }
        // Enforce 300MB total
        final total = await getTotalDownloadedBytes();
        if (total + done > kMaxTotalBytes) {
          await out.flush();
          await out.close();
          await f.delete();
          throw Exception('Total downloads would exceed 300 MB — delete a download first.');
        }
        onProgress(done.toDouble());
      }
      await out.flush();
      await out.close();
      if (active.cancelled) {
        final root2 = await _root();
        final ff = File(p.join(root2.path, relPath));
        if (await ff.exists()) await ff.delete();
      }
    } catch (_) {
      final root3 = await _root();
      final ff = File(p.join(root3.path, relPath));
      if (await ff.exists()) await ff.delete();
      rethrow;
    }
  }

  /// Decrypt a downloaded [.nfv] container into a temporary playable file.
  /// Returns the temp file path (deleted after playback).
  Future<File> decryptToTemp(DownloadItem item, {DownloadEpisode? episode}) async {
    final relPath = episode?.fileName ?? 'movie_${item.id}/${item.id}.nfv';
    final key = await _deriveKey();
    final encrypter = enc.Encrypter(
      enc.AES(enc.Key(key), mode: enc.AESMode.cbc),
    );

    final root = await _root();
    final src = File(p.join(root.path, relPath));
    if (!await src.exists()) throw FileSystemException('Missing $relPath');

    final raw = await src.readAsBytes();
    final iv = raw.sublist(5, 5 + 16);
    final body = Uint8List.sublistView(raw, 5 + 16);
    final out = encrypter.decryptBytes(enc.Encrypted(body), iv: enc.IV(iv));

    final tmpDir = await getTemporaryDirectory();
    final tmp = File(p.join(tmpDir.path,
        '${item.type}_${item.id}_${episode?.episode ?? 0}_${DateTime.now().millisecondsSinceEpoch}.mp4'));
    await tmp.writeAsBytes(out, flush: true);
    return tmp;
  }

  Future<void> deleteDownload(DownloadItem item) async {
    final root = await _root();
    final dir = Directory(p.join(root.path, item.isTv ? 'tv_${item.id}' : 'movie_${item.id}'));
    if (await dir.exists()) await dir.delete(recursive: true);
    final items = await loadManifest();
    items.removeWhere((x) => x.id == item.id && x.type == item.type);
    await _saveManifest(items);
  }

  void cancelActive() {
    for (final a in _active) {
      a.cancelled = true;
    }
  }

  List<ActiveDownload> get activeDownloads => List.unmodifiable(_active);

  Future<Uint8List> _deriveKey() async {
    final raw = utf8.encode('novaflix-offline-v1::$Platform.operatingSystem::$_deviceSalt');
    final hash = sha256.convert(raw);
    return Uint8List.fromList(hash.bytes);
  }

  static String get _deviceSalt =>
      Platform.isAndroid
          ? 'android::${Platform.version}'
          : Platform.isLinux
              ? 'linux::${Platform.version}'
              : 'other';

  Uint8List _randomIv() {
    final rng = math.Random.secure();
    return Uint8List.fromList(List.generate(16, (_) => rng.nextInt(256)));
  }

  Uint8List _buildHeader(Uint8List iv) {
    final out = BytesBuilder();
    out.add(utf8.encode(_magic));
    out.add([_version]);
    out.add(iv);
    return out.toBytes();
  }

  static const int headerSize = 5 + 16;
}

/// Provider wiring for the download service singleton.
final downloadServiceProvider = Provider<DownloadService>((ref) {
  final api = ref.read(apiServiceProvider);
  return DownloadService(api);
});
