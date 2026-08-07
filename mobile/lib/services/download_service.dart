import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../services/api_service.dart';

const _magic = 'NFLX'; // custom container magic bytes
const _version = 1;
const _chunkSize = 64 * 1024; // AES block aligned chunking

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

  /// Download a movie (single file) or a TV show (one file per episode).
  Future<void> downloadContent({
    required int contentId,
    required String type,
    required String title,
    String? poster,
    String? backdrop,
    int? season,
    int? episode,
    List<Map<String, dynamic>>? episodes,
  }) async {
    if (type == 'tv' && (episodes == null || episodes.isEmpty)) return;
    final epList = episodes ?? const <Map<String, dynamic>>[];

    if (type == 'movie') {
      final source = await _resolveSource(contentId, 'movie');
      if (source.isEmpty) return;
      final active = ActiveDownload(
        contentId: contentId,
        type: 'movie',
        title: title,
        poster: poster,
        backdrop: backdrop,
        episodeCount: 1,
        episodesDone: 0,
        totalBytes: 1,
        bytesDone: 0,
      );
      _active.add(active);
      await _downloadUrlToEncrypted(
        sourceUrl: source,
        relPath: 'movie_$contentId/$contentId.nfv',
        onProgress: (done) {
          active.bytesDone = done;
          active.totalBytes = math.max(active.totalBytes, done);
        },
        active: active,
      );
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
    final active = ActiveDownload(
      contentId: contentId,
      type: 'tv',
      title: title,
      poster: poster,
      backdrop: backdrop,
      episodeCount: total,
      episodesDone: 0,
      totalBytes: total.toDouble(),
      bytesDone: 0,
    );
    _active.add(active);
    for (var i = 0; i < epList.length; i++) {
      final ep = epList[i];
      final s = ep['season'] as int? ?? season ?? 1;
      final e = ep['episode'] as int? ?? (i + 1);
      final src = await _resolveSource(contentId, 'tv', season: s, episode: e);
      if (src.isEmpty) continue;
      final fileName =
          'S${s.toString().padLeft(2, '0')}E${e.toString().padLeft(2, '0')}.nfv';
      await _downloadUrlToEncrypted(
        sourceUrl: src,
        relPath: 'tv_$contentId/$fileName',
        onProgress: (_) {
          active.episodesDone = i;
        },
        active: active,
      );
      dlEpisodes.add(DownloadEpisode(
        season: s,
        episode: e,
        name: ep['name']?.toString() ?? 'Episode $e',
        fileName: 'tv_$contentId/$fileName',
      ));
      active.episodesDone = i + 1;
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

  Future<String> _resolveSource(int id, String type, {int? season, int? episode}) async {
    try {
      final res = await _api.getStreamSource(id, type, season: season, episode: episode);
      final data = res.data is Map<String, dynamic>
          ? res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>
          : <String, dynamic>{};
      return data['directUrl'] as String? ?? data['streamUrl'] as String? ?? '';
    } catch (_) {
      return '';
    }
  }

  /// Stream the source URL, encrypt chunk-by-chunk into the [.nfv] container.
  Future<void> _downloadUrlToEncrypted({
    required String sourceUrl,
    required String relPath,
    required void Function(double bytesDone) onProgress,
    required ActiveDownload active,
  }) async {
    final key = await _deriveKey();
    final iv = _randomIv();
    final encrypter = enc.Encrypter(
      enc.AES(enc.Key(Uint8List.fromList(key)), mode: enc.AESMode.cbc),
    );
    try {
      final stream = await _api.streamUrl(sourceUrl);
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
