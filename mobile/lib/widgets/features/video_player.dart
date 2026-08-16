import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import '../../theme/app_colors.dart';
import '../../services/api_service.dart';

const double _eggWindow = 2;

class VideoSubtitle {
  final String url;
  final String label;
  final String lang;
  const VideoSubtitle({required this.url, required this.label, required this.lang});
}

class VideoEgg {
  final String id;
  final double tsSeconds;
  final double posX;
  final double posY;
  final double radius;
  final String hint;
  const VideoEgg({
    required this.id,
    required this.tsSeconds,
    required this.posX,
    required this.posY,
    this.radius = 0.08,
    this.hint = '',
  });
}

class _AdItem {
  final String id;
  final String positionType;
  final double cueTimeSeconds;
  final int durationSeconds;
  const _AdItem({
    required this.id,
    required this.positionType,
    this.cueTimeSeconds = 0,
    this.durationSeconds = 15,
  });
}

class VideoPlayer extends ConsumerStatefulWidget {
  final String streamUrl;
  final Map<String, String>? httpHeaders;
  final String? errorReason;
  final String? fallbackUrl;
  final List<VideoSubtitle> subtitles;
  final String? title;
  final void Function(double progress)? onProgress;
  final void Function(double duration)? onDuration;
  final bool isFreeTier;
  final bool bingePassActive;
  final List<VideoEgg> eggs;
  final List<String> collectedEggIds;
  final void Function(String keyId)? onCollectEgg;

  const VideoPlayer({
    super.key,
    required this.streamUrl,
    this.httpHeaders,
    this.errorReason,
    this.fallbackUrl,
    this.subtitles = const [],
    this.title,
    this.onProgress,
    this.onDuration,
    this.isFreeTier = true,
    this.bingePassActive = false,
    this.eggs = const [],
    this.collectedEggIds = const [],
    this.onCollectEgg,
  });

  @override
  ConsumerState<VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends ConsumerState<VideoPlayer> {
  final _player = Player();
  late final VideoController _controller;

  double _currentTime = 0;
  double _duration = 0;
  bool _playing = false;
  bool _muted = false;
  double _volume = 1;
  bool _showControls = true;
  bool _loading = true;
  bool _fullscreen = false;
  String? _error;
  double _playbackRate = 1;
  bool _showSettings = false;
  BoxFit _fit = BoxFit.contain;
  double _aspect = 16 / 9;
  List<VideoTrack> _videoTracks = [];
  VideoTrack? _qualityTrack;
  String? _seekHint;
  Timer? _seekHintTimer;

  final List<StreamSubscription> _subs = [];

  List<_AdItem> _ads = [];
  _AdItem? _currentAd;
  bool _showPauseAd = false;
  final Set<double> _midRollTriggered = {};
  final List<String> _locallyCollected = [];
  String? _flashKey;

  int _skipUsed = 0;
  int _skipMax = 999;
  Timer? _controlsTimer;
  Timer? _progressTimer;

  bool _debugOverlay = false;
  final List<String> _debugLog = [];
  static const int _maxDebugLines = 80;
  Timer? _stallTimer;
  double _lastProgressAt = 0;
  bool _triedFallback = false;
  Timer? _noStartTimer;
  static const int _noStartTimeoutSeconds = 20;

  @override
  void initState() {
    super.initState();
    _debug('init: url=${widget.streamUrl}');
    _debug('init: headers=${widget.httpHeaders?.keys.join(',') ?? 'none'}');
    _debug('init: errorReason=${widget.errorReason}');
    _debug('init: fallbackUrl=${widget.fallbackUrl}');
    _controller = VideoController(_player);
    _bindStreams();
    _progressTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      widget.onProgress?.call(_currentTime);
    });
    _loadAds();
    _open();
  }

  void _debug(String msg) {
    _debugLog.add(msg);
    if (_debugLog.length > _maxDebugLines) _debugLog.removeAt(0);
    debugPrint('[vp] $msg');
  }

  void _toggleDebugOverlay() {
    if (mounted) setState(() => _debugOverlay = !_debugOverlay);
  }

  void _startStallWatch() {
    _stallTimer?.cancel();
    _lastProgressAt = _currentTime;
    _stallTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || _loading || _error != null) return;
      if (_playing && _currentTime == _lastProgressAt) {
        _debug('WARN stall: no progress for 5s (pos=${_currentTime.toStringAsFixed(1)}s)');
      } else {
        _lastProgressAt = _currentTime;
      }
    });
  }

  // Surfaces a clear error if playback never starts (position stuck at ~0s),
  // which is what happens when a provider serves ad-image segments or a dead
  // stream. Prevents an endless silent black screen.
  void _startNoStartWatch() {
    _noStartTimer?.cancel();
    _debug('no-start watch started (${_noStartTimeoutSeconds}s)');
    int ticks = 0;
    _noStartTimer = Timer.periodic(const Duration(seconds: 1), (_) async {
      if (!mounted) return;
      if (_currentTime > 0.5 || _error != null) {
        _noStartTimer?.cancel();
        return;
      }
      ticks++;
      if (ticks >= _noStartTimeoutSeconds) {
        _noStartTimer?.cancel();
        _debug(
          'NO-START: no playback start in ${_noStartTimeoutSeconds}s (pos=${_currentTime.toStringAsFixed(2)}s playing=$_playing)',
        );
        // A silent stall (position stuck at ~0) usually means the primary URL
        // opened but delivers no frames — try the fallback once before giving up.
        final recovered = await _tryFallback();
        if (recovered) {
          _debug('NO-START: fallback opened, waiting for playback');
          return;
        }
        if (mounted) {
          setState(() {
            _error =
                'Playback did not start. The stream may be serving ad placeholders or is unavailable.';
            _loading = false;
          });
        }
      }
    });
  }

  void _bindStreams() {
    _subs.add(_player.stream.position.listen((p) {
      if (!mounted) return;
      final t = p.inMilliseconds / 1000;
      setState(() {
        _currentTime = t;
        // A recovered stream auto-dismisses any surfaced error — a transient
        // hiccup must never leave the black "Playback Error" overlay up while
        // playback is clearly running again.
        if (_error != null && t > 1) {
          _error = null;
          _debug('auto-cleared error on playback resume');
        }
        if (_loading && t > 1) {
          _loading = false;
        }
      });
      _maybeTriggerMidRoll();
    }));
    _subs.add(_player.stream.duration.listen((d) {
      if (!mounted) return;
      _debug('stream duration=${d.inMilliseconds}ms');
      setState(() => _duration = d.inMilliseconds / 1000);
      widget.onDuration?.call(_duration);
    }));
    _subs.add(_player.stream.error.listen((e) async {
      if (!mounted) return;
      _debug('ERROR stream.error -> $e');
      // Playback was already underway — mpv frequently emits transient errors
      // (segment TLS timeouts, a failed subtitle fetch, etc.) that it recovers
      // from on its own. Treating those as fatal caused the player to re-open
      // the fallback mid-stream, killing a stream that was actually playing.
      // The stall watchdog handles genuinely dead playback.
      if (_currentTime > 5) {
        _debug('stream.error ignored: playback in progress');
        return;
      }
      // Playback never really started (e.g. CDN 403 without headers) — try the
      // fallback once before surfacing an error to the user.
      final recovered = await _tryFallback();
      if (recovered) {
        _debug('stream.error: fallback opened, verifying via no-start watch');
        return;
      }
      if (mounted) {
        setState(() {
          _error = _mapError(e);
          _loading = false;
        });
      }
    }));
    _subs.add(_player.stream.playing.listen((p) {
      if (!mounted) return;
      _debug('stream playing=$p');
      setState(() => _playing = p);
      _showPauseAd = false;
      if (p) {
        _resetControlsTimer();
        _startStallWatch();
      }
    }));
    _subs.add(_player.stream.tracks.listen((tracks) {
      if (!mounted) return;
      final seen = <String>{};
      final list = tracks.video
          .where((t) {
            if (t.id == 'no') return false;
            final key = (t.w != null && t.h != null) ? '${t.w}x${t.h}' : (t.title ?? t.id);
            return seen.add(key);
          })
          .toList()
        ..sort((a, b) => (b.h ?? 0).compareTo(a.h ?? 0));
      _debug('tracks: ${list.map((t) => '${t.h}p').join(',')}');
      setState(() => _videoTracks = list);
    }));
    _subs.add(_player.stream.log.listen((line) => _debug('mpv: $line')));
  }

  String _mapError(String raw) {
    final r = raw.toLowerCase();
    if (r.contains('404') || r.contains('not found') || r.contains('expired')) {
      return 'Stream link has expired or is unavailable';
    }
    if (r.contains('403') || r.contains('forbidden') || r.contains('access denied')) {
      return 'Stream provider is blocking playback';
    }
    if (r.contains('ad') || r.contains('image')) {
      return 'This title is currently serving ad placeholders and cannot be played';
    }
    return widget.errorReason ?? 'Failed to load video stream';
  }

  // Attempts to open the fallback URL once (guarded by [_triedFallback] so
  // retries never loop). Does NOT claim success on open() resolving — mpv
  // resolves open() even for URLs that deliver no frames, which is why the old
  // "recovered via fallback" path cleared the error and kept a dead stream
  // alive. The no-start watchdog (started before open) judges real success and
  // surfaces the error if nothing actually plays.
  Future<bool> _tryFallback() async {
    final fallback = widget.fallbackUrl;
    if (_triedFallback || fallback == null || fallback.isEmpty) return false;
    if (fallback == widget.streamUrl) return false;
    _triedFallback = true;
    _debug('open: retrying via fallback $fallback');
    _startNoStartWatch();
    try {
      await _player.open(Media(fallback));
      _debug('open: fallback OK (no-start watch will verify playback)');
      _player.setVolume(_muted ? 0 : _volume);
      _player.setRate(_playbackRate);
      return true;
    } catch (e) {
      _debug('open: fallback ALSO failed -> $e');
      return false;
    }
  }

  Future<void> _open() async {
    _triedFallback = false;
    _startNoStartWatch();
    setState(() {
      _loading = true;
      _error = null;
    });
    final started = DateTime.now();
    final primary = widget.streamUrl;
    _debug('open: start $primary');
    try {
      final headers = widget.httpHeaders;
      await _player.open(
        headers != null && headers.isNotEmpty
            ? Media(primary, httpHeaders: headers)
            : Media(primary),
      );
      _debug('open: done in ${DateTime.now().difference(started).inMilliseconds}ms');
      _player.setVolume(_muted ? 0 : _volume);
      _player.setRate(_playbackRate);
      if (mounted) {
        setState(() => _loading = false);
      }
    } catch (e) {
      _debug('open: ERROR primary -> $e');
      final ok = await _tryFallback();
      if (!ok && mounted) {
        setState(() {
          _error = _mapError('$e');
          _loading = false;
        });
      }
    }
  }

  Future<void> _loadAds() async {
    if (!widget.isFreeTier || widget.bingePassActive) return;
    final api = ref.read(apiServiceProvider);
    try {
      final res = await api.getNextAd();
      final data = res.data['data'] ?? res.data;
      final ads = data['ads'] as List? ?? [];
      if (ads.isNotEmpty && mounted) {
        setState(() {
          _ads = ads.map((a) {
            final m = a is Map ? Map<String, dynamic>.from(a) : <String, dynamic>{};
            return _AdItem(
              id: '${m['id'] ?? m['_id'] ?? ''}',
              positionType: '${m['position_type'] ?? 'mid_roll'}',
              cueTimeSeconds: (m['cue_time_seconds'] as num?)?.toDouble() ?? 0,
              durationSeconds: (m['duration_seconds'] as num?)?.toInt() ?? 15,
            );
          }).toList();
        });
      }
    } catch (_) {}
    try {
      final sl = await api.getSkipLimit();
      final d = sl.data['data'] ?? sl.data;
      if (mounted) {
        setState(() {
          _skipUsed = (d['skips_used'] as num?)?.toInt() ?? 0;
          _skipMax = (d['skips_max'] as num?)?.toInt() ?? 999;
        });
      }
    } catch (_) {}
  }

  void _maybeShowPauseAd() {
    if (!widget.isFreeTier || widget.bingePassActive) return;
    if (_currentAd != null) return;
    final has = _ads.any((a) => a.positionType == 'pause');
    if (has) setState(() => _showPauseAd = true);
  }

  void _maybeTriggerMidRoll() {
    if (!widget.isFreeTier || widget.bingePassActive) return;
    if (_ads.isEmpty || _currentAd != null || !_playing) return;
    for (final ad in _ads) {
      if (ad.positionType != 'mid_roll') continue;
      if (_currentTime >= ad.cueTimeSeconds &&
          _currentTime < ad.cueTimeSeconds + 5 &&
          !_midRollTriggered.contains(ad.cueTimeSeconds)) {
        _midRollTriggered.add(ad.cueTimeSeconds);
        _player.pause();
        setState(() => _currentAd = ad);
        break;
      }
    }
  }

  void _resetControlsTimer() {
    if (!mounted) return;
    setState(() => _showControls = true);
    _controlsTimer?.cancel();
    // On desktop a pointer is always available, so auto-hiding the control bar
    // just makes controls feel "lost". Keep them visible there.
    if (_playing && !kIsWeb && defaultTargetPlatform != TargetPlatform.linux) {
      _controlsTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) setState(() => _showControls = false);
      });
    }
  }

  void _togglePlay() {
    if (_currentAd != null || _showPauseAd) return;
    if (_playing) {
      _player.pause();
      _maybeShowPauseAd();
    } else {
      _player.play();
    }
  }

  void _handleSeek(double fraction) {
    if (_currentAd != null || _duration <= 0) return;
    _player.seek(Duration(milliseconds: (fraction * _duration * 1000).round()));
  }

  void _toggleMute() {
    _muted = !_muted;
    _player.setVolume(_muted ? 0 : _volume);
    setState(() {});
  }

  void _setVolume(double v) {
    _volume = v;
    _muted = v == 0;
    _player.setVolume(v);
    setState(() {});
  }

  void _setSpeed(double r) {
    _playbackRate = r;
    _player.setRate(r);
    setState(() => _showSettings = false);
  }

  void _setQuality(VideoTrack? track) {
    _qualityTrack = track;
    if (track == null) {
      _player.setVideoTrack(VideoTrack.auto());
    } else {
      _player.setVideoTrack(track);
    }
    setState(() => _showSettings = false);
  }

  void _setAspect(double a) {
    setState(() => _aspect = a);
  }

  void _setFit(BoxFit f) {
    setState(() => _fit = f);
  }

  void _showSeekHint(String label) {
    _seekHintTimer?.cancel();
    setState(() => _seekHint = label);
    _seekHintTimer = Timer(const Duration(milliseconds: 700), () {
      if (mounted) setState(() => _seekHint = null);
    });
  }

  void _seekBy(double seconds) {
    if (_currentAd != null || _duration <= 0) return;
    final target = (_currentTime + seconds).clamp(0.0, _duration);
    _player.seek(Duration(milliseconds: (target * 1000).round()));
    _showSeekHint(seconds >= 0 ? '+${seconds.toStringAsFixed(0)}s' : '−${seconds.abs().toStringAsFixed(0)}s');
  }

  Future<void> _toggleFullscreen() async {
    if (!mounted) return;
    if (_fullscreen) {
      Navigator.of(context).pop();
      return;
    }
    // SystemChrome orientation/UI-mode calls aren't implemented on desktop
    // (Linux) and can throw, which previously left [_fullscreen] stuck true and
    // made the button appear dead. The route-based fullscreen still works
    // everywhere, so those calls are best-effort only.
    try {
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    } catch (_) {}
    if (!mounted) return;
    setState(() => _fullscreen = true);
    try {
      await Navigator.of(context).push(
        PageRouteBuilder(
          opaque: true,
          transitionDuration: Duration.zero,
          reverseTransitionDuration: Duration.zero,
          pageBuilder: (_, _, _) => _FullscreenPlayer(
            onExit: _exitFullscreen,
            child: _buildPlayerBody(),
          ),
        ),
      );
    } catch (_) {
      if (mounted) setState(() => _fullscreen = false);
    }
  }

  Future<void> _exitFullscreen() async {
    if (!mounted) return;
    setState(() => _fullscreen = false);
    try {
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    } catch (_) {}
  }

  Future<void> _skipForward() async {
    if (widget.isFreeTier) {
      final api = ref.read(apiServiceProvider);
      try {
        final sl = await api.getSkipLimit();
        final d = sl.data['data'] ?? sl.data;
        final used = (d['skips_used'] as num?)?.toInt() ?? _skipUsed;
        final max = (d['skips_max'] as num?)?.toInt() ?? _skipMax;
        if (used >= max) return;
        await api.incrementSkip();
        setState(() {
          _skipUsed = used + 1;
          _skipMax = max;
        });
      } catch (_) {
        return;
      }
    }
    _player.seek(Duration(
      milliseconds: (math.min(_duration, _currentTime + 10) * 1000).round(),
    ));
  }

  void _handleAdComplete() {
    setState(() => _currentAd = null);
    _player.play();
  }

  void _handleAdSkip() {
    final ad = _currentAd;
    if (ad != null) _midRollTriggered.remove(ad.cueTimeSeconds);
    _handleAdComplete();
  }

  String _formatTime(double s) {
    final m = s ~/ 60;
    final sec = (s % 60).floor();
    return '$m:${sec.toString().padLeft(2, '0')}';
  }

  List<VideoEgg> get _activeEggs {
    final collected = {...widget.collectedEggIds, ..._locallyCollected};
    return widget.eggs
        .where((e) =>
            !collected.contains(e.id) && (_currentTime - e.tsSeconds).abs() <= _eggWindow)
        .toList();
  }

  void _collectEgg(VideoEgg e) {
    if (_locallyCollected.contains(e.id) || _currentAd != null || _showPauseAd) return;
    setState(() {
      _locallyCollected.add(e.id);
      _flashKey = e.hint;
    });
    widget.onCollectEgg?.call(e.id);
    Future.delayed(const Duration(milliseconds: 3500), () {
      if (mounted) setState(() => _flashKey = null);
    });
  }

  @override
  void dispose() {
    _stallTimer?.cancel();
    _noStartTimer?.cancel();
    for (final s in _subs) {
      s.cancel();
    }
    _controlsTimer?.cancel();
    _progressTimer?.cancel();
    _seekHintTimer?.cancel();
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: AspectRatio(
        aspectRatio: _aspect,
        child: _buildPlayerBody(),
      ),
    );
  }

  Widget _buildPlayerBody() {
    return Stack(
      fit: StackFit.expand,
      children: [
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            _togglePlay();
            _resetControlsTimer();
          },
          onDoubleTapDown: (d) {
            final w = context.size?.width ?? 0;
            final frac = w <= 0 ? 0.5 : (d.localPosition.dx / w);
            if (frac < 1 / 3) {
              _seekBy(-10);
            } else if (frac > 2 / 3) {
              _seekBy(10);
            } else {
              _togglePlay();
            }
          },
          onVerticalDragUpdate: (d) {
            final v = (_volume - d.delta.dy / 200).clamp(0.0, 1.0);
            _setVolume(v);
          },
          onLongPress: _toggleDebugOverlay,
          child: Video(
            controller: _controller,
            controls: NoVideoControls,
            wakelock: true,
            fit: _fit,
          ),
        ),

        if (_loading && _error == null)
          Container(
            color: Colors.black54,
            alignment: Alignment.center,
            child: SizedBox(
              width: 40,
              height: 40,
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation(AppColors.primary),
                strokeWidth: 2,
              ),
            ),
          ),

        if (_error != null) _buildError(),

        if (_showPauseAd) _buildPauseAd(),

        if (_currentAd != null) _buildMidRollAd(),

        if (_activeEggs.isNotEmpty && _currentAd == null && !_showPauseAd)
          Positioned.fill(child: _buildEggOverlays()),

        if (_flashKey != null)
          Positioned(
            top: 24,
            left: 0,
            right: 0,
            child: Center(child: _buildFlash()),
          ),

        if (_seekHint != null)
          Positioned.fill(
            child: IgnorePointer(
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Text(
                    _seekHint!,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ),

        if (_debugOverlay) _buildDebugOverlay(),

        _buildControlBar(),
      ],
    );
  }

  Widget _buildDebugOverlay() {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.92),
        child: Column(
          children: [
            Row(
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Text(
                    'Debug — tap video again to close',
                    style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: _toggleDebugOverlay,
                ),
              ],
            ),
            Expanded(
              child: ListView.builder(
                itemCount: _debugLog.length,
                itemBuilder: (context, i) {
                  final lineIndex = _debugLog.length - 1 - i;
                  if (lineIndex < 0) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                    child: Text(
                      _debugLog[lineIndex],
                      style: const TextStyle(color: Colors.white70, fontSize: 11, fontFamily: 'monospace'),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Container(
      color: Colors.black87,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error, color: Colors.redAccent, size: 40),
          const SizedBox(height: 8),
          const Text('Playback Error',
              style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(_error!,
                style: const TextStyle(color: Colors.white54, fontSize: 13),
                textAlign: TextAlign.center),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _open,
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryContainer),
            child: const Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildPauseAd() {
    return Container(
      color: Colors.black87,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.play_circle_outline, color: Colors.white70, size: 56),
          const SizedBox(height: 12),
          const Text('Advertisement',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 6),
          Text('Free users see a short ad',
              style: TextStyle(color: Colors.white60, fontSize: 13)),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              setState(() => _showPauseAd = false);
              _player.play();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryContainer),
            child: const Text('Play', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildMidRollAd() {
    return Container(
      color: Colors.black,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.local_movies, color: Colors.white70, size: 56),
          const SizedBox(height: 12),
          const Text('Advertisement',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton(
                onPressed: _handleAdSkip,
                child: const Text('Skip', style: TextStyle(color: Colors.white)),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _handleAdComplete,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryContainer),
                child: const Text('Watch', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEggOverlays() {
    return Stack(
      children: _activeEggs.map((e) {
        final size = math.max(e.radius * 180, 36.0);
        return Positioned(
          left: (e.posX * 100).clamp(0.0, 100.0),
          top: (e.posY * 100).clamp(0.0, 100.0),
          child: GestureDetector(
            onTap: () => _collectEgg(e),
            child: Container(
              width: size,
              height: size,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accent,
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.key, color: Colors.black, size: 20),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFlash() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.accent,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _flashKey == null || _flashKey!.isEmpty
            ? 'Key found! Reward unlocked'
            : 'Key found! "${_flashKey}"',
        style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w600, fontSize: 13),
      ),
    );
  }

  Widget _buildControlBar() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: AnimatedOpacity(
        opacity: _showControls ? 1 : 0,
        duration: const Duration(milliseconds: 250),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Colors.black87],
            ),
          ),
          padding: const EdgeInsets.fromLTRB(12, 24, 12, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (widget.title != null)
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 8),
                  child: Text(widget.title!,
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ),
              _seekBar(),
              const SizedBox(height: 8),
              Row(
                children: [
                  _iconBtn(_playing ? Icons.pause : Icons.play_arrow, _togglePlay),
                  const SizedBox(width: 4),
                  _iconBtn(Icons.forward_10, _skipForward),
                  const SizedBox(width: 4),
                  _iconBtn(
                      _muted || _volume == 0 ? Icons.volume_off : Icons.volume_up, _toggleMute),
                  Expanded(
                    child: Slider(
                      value: _muted ? 0 : _volume,
                      onChanged: _setVolume,
                      min: 0,
                      max: 1,
                      activeColor: AppColors.primary,
                      inactiveColor: Colors.white24,
                    ),
                  ),
                  Text(
                    '${_formatTime(_currentTime)} / ${_formatTime(_duration)}',
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  const SizedBox(width: 4),
                  _settingsBtn(),
                  const SizedBox(width: 4),
                  _iconBtn(
                    _fullscreen ? Icons.fullscreen_exit : Icons.fullscreen,
                    _toggleFullscreen,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _seekBar() {
    final progress = _duration > 0 ? (_currentTime / _duration).clamp(0.0, 1.0) : 0.0;
    return LayoutBuilder(builder: (context, constraints) {
      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (d) =>
            _handleSeek((d.localPosition.dx / constraints.maxWidth).clamp(0.0, 1.0)),
        child: Container(
          height: 16,
          alignment: Alignment.center,
          child: Stack(
            alignment: Alignment.centerLeft,
            children: [
              Container(height: 3, color: Colors.white24),
              FractionallySizedBox(
                widthFactor: progress.toDouble(),
                child: Container(height: 3, color: AppColors.primary),
              ),
            ],
          ),
        ),
      );
    });
  }

  Widget _settingsBtn() {
    return Stack(
      children: [
        _iconBtn(Icons.settings, () => setState(() => _showSettings = !_showSettings)),
        if (_showSettings)
          Positioned(
            right: 0,
            bottom: 44,
            child: Container(
              width: 210,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _SettingsLabel('Quality'),
                  _settingsTile(
                    'Auto',
                    selected: _qualityTrack == null,
                    onTap: () => _setQuality(null),
                  ),
                  ..._videoTracks.map((t) {
                    final label =
                        t.h != null && t.h! > 0 ? '${t.h}p' : (t.title ?? t.id);
                    return _settingsTile(
                      label,
                      selected: _qualityTrack?.id == t.id,
                      onTap: () => _setQuality(t),
                    );
                  }),
                  const _SettingsLabel('Screen'),
                  _settingsTile('16:9', selected: _aspect == 16 / 9,
                      onTap: () => _setAspect(16 / 9)),
                  _settingsTile('9:16', selected: _aspect == 9 / 16,
                      onTap: () => _setAspect(9 / 16)),
                  _settingsTile('4:3', selected: _aspect == 4 / 3,
                      onTap: () => _setAspect(4 / 3)),
                  _settingsTile('2.35:1', selected: _aspect == 2.35,
                      onTap: () => _setAspect(2.35)),
                  const _SettingsLabel('Crop / Fit'),
                  _settingsTile('Fit / Letterbox',
                      selected: _fit == BoxFit.contain,
                      onTap: () => _setFit(BoxFit.contain)),
                  _settingsTile('Fill / Crop', selected: _fit == BoxFit.cover,
                      onTap: () => _setFit(BoxFit.cover)),
                  _settingsTile('Stretch', selected: _fit == BoxFit.fill,
                      onTap: () => _setFit(BoxFit.fill)),
                  const _SettingsLabel('Speed'),
                  ...[0.5, 1.0, 1.5, 2.0].map((s) {
                    return _settingsTile('${s}x',
                        selected: _playbackRate == s, onTap: () => _setSpeed(s));
                  }),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _settingsTile(String label, {required bool selected, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                color: selected ? AppColors.primary : Colors.white70,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }
}

class _SettingsLabel extends StatelessWidget {
  final String text;
  const _SettingsLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _FullscreenPlayer extends StatelessWidget {
  final Widget child;
  final VoidCallback onExit;

  const _FullscreenPlayer({required this.child, required this.onExit});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: PopScope(
        canPop: true,
        onPopInvokedWithResult: (didPop, _) {
          if (didPop) onExit();
        },
        child: SafeArea(
          child: Stack(
            fit: StackFit.expand,
            children: [
              child,
              Positioned(
                top: 8,
                right: 8,
                child: IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.fullscreen_exit, color: Colors.white),
                  tooltip: 'Exit fullscreen',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
