import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../services/ws_service.dart';
import '../core/responsive.dart';
import '../widgets/ui/index.dart';
import '../providers/auth_provider.dart';

final _hooksProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getHooksFeed();
  final data = res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class HooksFeedScreen extends ConsumerStatefulWidget {
  const HooksFeedScreen({super.key});

  @override
  ConsumerState<HooksFeedScreen> createState() => _HooksFeedScreenState();
}

class _HooksFeedScreenState extends ConsumerState<HooksFeedScreen> {
  final _pageController = PageController();
  int _activeIndex = 0;
  Timer? _refreshTimer;
  List<Map<String, dynamic>>? _liveItems;

  WebSocketChannel? _ws;
  StreamSubscription? _wsSub;
  Timer? _wsReconnectTimer;
  int _wsAttempts = 0;
  final _liveShortCtrl = StreamController<Map<String, dynamic>>.broadcast();

  static const _countKeys = [
    'likes',
    'likesCount',
    'comments',
    'commentsCount',
    'bookmarks',
    'bookmarksCount',
    'shares',
    'views',
  ];

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 45), (_) {
      if (mounted) _refreshCounts();
    });
    _connectWs();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _wsSub?.cancel();
    _wsReconnectTimer?.cancel();
    try {
      _ws?.sink.close();
    } catch (_) {}
    _liveShortCtrl.close();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _connectWs() async {
    _wsReconnectTimer?.cancel();
    try {
      final ch = await WsService.connect('/ws');
      if (!mounted) {
        try {
          ch.sink.close();
        } catch (_) {}
        return;
      }
      _ws = ch;
      _wsAttempts = 0;
      _wsSub?.cancel();
      _wsSub = ch.stream.listen((raw) {
        try {
          final data = jsonDecode(raw is String ? raw : raw.toString());
          if (data is! Map) return;
          final type = data['type']?.toString();

          if (type == 'shorts:comment') {
            final commentRaw = data['comment'];
            final comment = commentRaw is Map
                ? Map<String, dynamic>.from(commentRaw)
                : <String, dynamic>{};
            final shortId = data['shortId']?.toString() ??
                comment['short_id']?.toString();
            if (shortId == null || !mounted) return;
            setState(() {
              _liveItems = _liveItems == null
                  ? null
                  : _liveItems!
                      .map(_bumpCommentCount(shortId))
                      .toList();
            });
            _liveShortCtrl.add({'shortId': shortId, 'comment': comment});
            return;
          }

          final shortId = data['shortId']?.toString();
          if (shortId == null || !mounted) return;
          if (type == 'shorts:like') {
            final likes = data['likes'];
            setState(() {
              _liveItems = _syncCount(shortId, 'likes', likes);
              if (likes != null) {
                _liveItems = _syncCount(shortId, 'likesCount', likes);
              }
            });
          } else if (type == 'shorts:bookmark') {
            final bookmarks = data['bookmarks'];
            setState(() {
              _liveItems = _syncCount(shortId, 'bookmarks', bookmarks);
              if (bookmarks != null) {
                _liveItems = _syncCount(shortId, 'bookmarksCount', bookmarks);
              }
            });
          } else if (type == 'shorts:view') {
            final views = data['views'];
            setState(() {
              _liveItems = _syncCount(shortId, 'views', views);
            });
          } else if (type == 'shorts:share') {
            final shares = data['shares'];
            setState(() {
              _liveItems = _syncCount(shortId, 'shares', shares);
            });
          }
        } catch (_) {}
      }, onDone: _scheduleReconnect, onError: (_) => _scheduleReconnect());
    } catch (_) {
      _scheduleReconnect();
    }
  }

  Map<String, dynamic> Function(Map<String, dynamic>) _bumpCommentCount(
      String shortId) {
    return (item) {
      final id = item['shortId']?.toString();
      if (id != shortId) return item;
      final next = Map<String, dynamic>.from(item);
      if (next['comments'] is num) {
        next['comments'] = (next['comments'] as num) + 1;
      }
      if (next['commentsCount'] is num) {
        next['commentsCount'] = (next['commentsCount'] as num) + 1;
      }
      return next;
    };
  }

  List<Map<String, dynamic>>? _syncCount(
      String shortId, String key, dynamic value) {
    final items = _liveItems;
    if (items == null || value == null) return items;
    return items.map((item) {
      final id = item['shortId']?.toString();
      if (id != shortId) return item;
      return {...item, key: value};
    }).toList();
  }

  void _scheduleReconnect() {
    if (!mounted) return;
    _wsSub?.cancel();
    _wsSub = null;
    try {
      _ws?.sink.close();
    } catch (_) {}
    _ws = null;
    if (_wsAttempts > 10) return;
    final delayMs = (1000 * (1 << _wsAttempts)).clamp(1000, 10000);
    _wsAttempts++;
    _wsReconnectTimer =
        Timer(Duration(milliseconds: delayMs), () => _connectWs());
  }

  Future<void> _refreshCounts() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.getHooksFeed();
      final fresh = ((res.data['data'] as List?) ?? [])
          .cast<Map<String, dynamic>>();
      if (!mounted || fresh.isEmpty) return;
      final byId = {for (final f in fresh) f['id']?.toString(): f};
      final current = _liveItems ?? [];
      final merged = current.map((item) {
        final id = item['id']?.toString();
        if (id == null) return item;
        final f = byId[id];
        if (f == null) return item;
        final next = Map<String, dynamic>.from(item);
        for (final k in _countKeys) {
          if (f[k] != null) next[k] = f[k];
        }
        final liked = f['liked'];
        final bookmarked = f['bookmarked'];
        if (liked != null) next['liked'] = liked;
        if (bookmarked != null) next['bookmarked'] = bookmarked;
        return next;
      }).toList();
      setState(() => _liveItems = merged);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final hooks = ref.watch(_hooksProvider);
    final width = MediaQuery.sizeOf(context).width;
    final isDesktop = screenSizeFor(width) != ScreenSize.mobile;
    final authState = ref.watch(authProvider);
    final isCreator = authState.user?.isCreator == true || authState.user?.isAdmin == true;

    return Scaffold(
      backgroundColor: Colors.black,
      body: hooks.when(
        data: (items) {
          if (_liveItems == null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && _liveItems == null) {
                setState(() => _liveItems = items);
              }
            });
          }
          final display = _liveItems ?? items;
          if (display.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.videocam, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'No hooks available',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                ],
              ),
            );
          }
          return Row(
            children: [
              Expanded(
                child: Center(
                  child: isDesktop
                      ? ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 450),
                          child: _phoneFrame(display),
                        )
                      : _phoneFrame(items),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: LoadingSpinner(size: 32)),
        error: (e, _) => Center(
          child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
        ),
      ),
    );
  }

  Widget _phoneFrame(List<Map<String, dynamic>> items) {
    final authState = ref.watch(authProvider);
    final isCreator = authState.user?.isCreator == true || authState.user?.isAdmin == true;
    return AspectRatio(
      aspectRatio: 9 / 16,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF262626)),
          boxShadow: const [BoxShadow(color: Colors.black, blurRadius: 32)],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: items.length,
            onPageChanged: (i) => setState(() => _activeIndex = i),
            itemBuilder: (_, i) => _HookCard(
              hook: items[i],
              active: i == _activeIndex,
              liveShortCtrl: _liveShortCtrl,
            ),
          ),
          Positioned(
            top: 16,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '${_activeIndex + 1} / ${items.length}',
                style: const TextStyle(
                  color: Colors.white60,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          if (isCreator)
            Positioned(
              top: 16,
              right: 16,
              child: GestureDetector(
                onTap: () => _showUploadModal(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add, color: Colors.white, size: 14),
                      SizedBox(width: 4),
                      Text(
                        'Upload Trailers',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          if (!isCreator)
            Positioned(
              top: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.white12),
                ),
                child: const Text(
                  'Viewer mode — creators can upload',
                  style: TextStyle(color: Colors.white54, fontSize: 11),
                ),
              ),
            ),
        ],
        ),
      ),
    );
  }

  void _showUploadModal() {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: AppColors.surfaceContainerHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text(
                    'Upload a Short',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Video embedding is currently unavailable on this app.',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _HookCard extends ConsumerStatefulWidget {
  final Map<String, dynamic> hook;
  final bool active;
  final StreamController<Map<String, dynamic>> liveShortCtrl;

  const _HookCard({required this.hook, required this.active, required this.liveShortCtrl});

  @override
  ConsumerState<_HookCard> createState() => _HookCardState();
}

class _HookCardState extends ConsumerState<_HookCard> {
  final _player = Player();
  late final VideoController _controller;
  bool _playing = false;
  bool _viewRecorded = false;

  late int _likes;
  late int _bookmarks;
  late int _shares;
  late bool _liked;
  late bool _bookmarked;

  String get _shortId => widget.hook['shortId']?.toString() ?? '';

  String get _type => widget.hook['type']?.toString() ?? '';
  bool get _isShort => _type == 'short';
  bool get _isTrailer => _type == 'trailer' || _type == 'ad';

  static int _num(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }

  @override
  void initState() {
    super.initState();
    _controller = VideoController(_player);
    _likes = _num(widget.hook['likes'] ?? widget.hook['likesCount']);
    _bookmarks =
        _num(widget.hook['bookmarks'] ?? widget.hook['bookmarksCount']);
    _shares = _num(widget.hook['shares']);
    _liked = (widget.hook['liked'] as bool?) ?? false;
    _bookmarked = (widget.hook['bookmarked'] as bool?) ?? false;
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  Future<void> _play() async {
    if (_playing) return;
    final url = widget.hook['videoUrl']?.toString();
    if (url == null || url.isEmpty) {
      debugPrint('[HookCard] No video URL for short');
      return;
    }
    debugPrint('[HookCard] Playing short: $url');
    setState(() => _playing = true);
    try {
      await _player.open(Media(url));
      await _player.play();
      debugPrint('[HookCard] Playback started successfully');
    } catch (e) {
      debugPrint('[HookCard] Playback error: $e');
      if (mounted) setState(() => _playing = false);
    }
  }

  Future<void> _pause() async {
    try {
      await _player.pause();
    } catch (_) {}
    if (mounted) setState(() => _playing = false);
  }

  Future<void> _openTrailer() async {
    final url = widget.hook['videoUrl']?.toString();
    if (url == null || url.isEmpty) return;
    final watch = url.contains('/embed/')
        ? url
            .replaceFirst('/embed/', '/watch?v=')
            .replaceFirst(RegExp(r'[?&].*'), '')
        : url;
    final uri = Uri.parse(watch);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _recordView() async {
    final id = _shortId;
    if (id.isEmpty) return;
    try {
      await ref.read(apiServiceProvider).recordShortView(id);
    } catch (_) {}
  }

  Future<void> _toggleLike() async {
    final id = _shortId;
    if (id.isEmpty) return;
    setState(() {
      _liked = !_liked;
      _likes += _liked ? 1 : -1;
    });
    try {
      await ref.read(apiServiceProvider).likeShort(id);
    } catch (_) {
      if (mounted) {
        setState(() {
          _liked = !_liked;
          _likes += _liked ? 1 : -1;
        });
      }
    }
  }

  Future<void> _toggleBookmark() async {
    final id = _shortId;
    if (id.isEmpty) return;
    setState(() {
      _bookmarked = !_bookmarked;
      _bookmarks += _bookmarked ? 1 : -1;
    });
    try {
      await ref.read(apiServiceProvider).bookmarkShort(id);
    } catch (_) {
      if (mounted) {
        setState(() {
          _bookmarked = !_bookmarked;
          _bookmarks += _bookmarked ? 1 : -1;
        });
      }
    }
  }

  Future<void> _share() async {
    final id = _shortId;
    setState(() => _shares++);
    if (id.isEmpty) return;
    try {
      await ref.read(apiServiceProvider).shareShort(id);
    } catch (_) {}
  }

  void _openComments() {
    final id = _shortId;
    if (id.isEmpty) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceContainerHigh,
      isScrollControlled: true,
      builder: (_) => _CommentsSheet(
        shortId: id,
        liveStream: widget.liveShortCtrl.stream,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hook = widget.hook;
    final title = hook['title']?.toString() ?? '';
    final description = hook['description']?.toString() ?? '';
    final poster = hook['poster']?.toString();
    final creatorName = hook['creatorName']?.toString() ?? 'Novaflix';
    final comments = _num(hook['comments'] ?? hook['commentsCount']);
    final hashtags = (hook['hashtags'] as List?)?.cast<String>() ??
        ['fyp', 'novaflix', 'shorts'];

    if (widget.active && !_viewRecorded && _isShort) {
      _viewRecorded = true;
      _recordView();
    }
    if (widget.active && _isShort && !_playing) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && widget.active && !_playing) _play();
      });
    } else if (!widget.active && _playing) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !widget.active && _playing) _pause();
      });
    }

    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (_isShort && _playing)
            AspectRatio(
              aspectRatio: 9 / 16,
              child: Video(
                controller: _controller,
                controls: NoVideoControls,
                wakelock: true,
              ),
            )
          else if (_isTrailer || (_isShort && !_playing))
            _posterLayer(poster, playable: _isShort || _isTrailer)
          else if (poster != null)
            CachedNetworkImage(
              imageUrl: poster,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => const _HookFallback(),
            )
          else
            const _HookFallback(),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.4),
                  Colors.black.withValues(alpha: 0.9),
                ],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),
          Positioned(
            right: 12,
            bottom: 110,
            child: Column(
              children: [
                // Profile linked to creator — tappable avatar
                GestureDetector(
                  onTap: () {
                    final creatorId = widget.hook['creatorId']?.toString();
                    if (creatorId != null && creatorId.isNotEmpty) {
                      // Navigate to creator public profile
                      // Uses real shorts creator_profiles linkage
                      try { Navigator.of(context).pushNamed('/user/$creatorId'); } catch (_) {}
                    }
                  },
                  child: const _CircleIcon(
                    icon: Icons.person,
                    size: 48,
                    border: true,
                  ),
                ),
                const SizedBox(height: 12),
                _ActionIcon(
                  icon: _liked ? Icons.favorite : Icons.favorite_border,
                  color: _liked ? Colors.redAccent : Colors.white,
                  count: _likes,
                  onTap: _toggleLike,
                ),
                const SizedBox(height: 20),
                _ActionIcon(
                  icon: Icons.chat_bubble,
                  count: comments,
                  onTap: _openComments,
                ),
                const SizedBox(height: 20),
                _ActionIcon(
                  icon: _bookmarked ? Icons.bookmark : Icons.bookmark_border,
                  color: _bookmarked ? AppColors.primary : Colors.white,
                  count: _bookmarks,
                  onTap: _toggleBookmark,
                ),
                const SizedBox(height: 20),
                _ActionIcon(
                  icon: Icons.share,
                  count: _shares,
                  onTap: _share,
                ),
              ],
            ),
          ),
          Positioned(
            left: 16,
            right: 64,
            bottom: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.isNotEmpty ? title : '@$creatorName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: hashtags
                      .take(3)
                      .map(
                        (h) => Text(
                          '#$h',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _posterLayer(String? poster, {required bool playable}) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (poster != null)
          CachedNetworkImage(
            imageUrl: poster,
            fit: BoxFit.cover,
            errorWidget: (_, _, _) => const _HookFallback(),
          )
        else
          const _HookFallback(),
        if (playable)
          Center(
            child: GestureDetector(
              onTap: _isTrailer ? _openTrailer : _play,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black.withValues(alpha: 0.5),
                  border: Border.all(color: Colors.white70, width: 2),
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _CommentsSheet extends ConsumerStatefulWidget {
  final String shortId;
  final Stream<Map<String, dynamic>>? liveStream;
  const _CommentsSheet({required this.shortId, this.liveStream});

  @override
  ConsumerState<_CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends ConsumerState<_CommentsSheet> {
  final _textCtl = TextEditingController();
  List<Map<String, dynamic>> _comments = [];
  bool _loading = true;
  String? _error;
  StreamSubscription? _liveSub;

  @override
  void initState() {
    super.initState();
    _load();
    final stream = widget.liveStream;
    if (stream != null) {
      _liveSub = stream.listen((e) {
        final shortId = e['shortId']?.toString();
        if (shortId != widget.shortId) return;
        final comment = e['comment'];
        if (comment is! Map || comment.isEmpty) return;
        if (!mounted) return;
        final c = Map<String, dynamic>.from(comment);
        final id = c['id']?.toString();
        setState(() {
          if (id != null && _comments.any((x) => x['id']?.toString() == id)) {
            return;
          }
          _comments.insert(0, c);
        });
      });
    }
  }

  @override
  void dispose() {
    _liveSub?.cancel();
    _textCtl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.getShortComments(widget.shortId);
      final data = res.data['data'] as List? ?? res.data['comments'] as List? ?? [];
      if (mounted) {
        setState(() {
          _comments = data.cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Could not load comments';
          _loading = false;
        });
      }
    }
  }

  Future<void> _post() async {
    final text = _textCtl.text.trim();
    if (text.isEmpty) return;
    setState(() => _textCtl.clear());
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.createShortComment(widget.shortId, text);
      final data = res.data['data'] as Map<String, dynamic>?;
      if (data != null && mounted) {
        setState(() => _comments.insert(0, data));
      } else {
        _load();
      }
    } catch (_) {
      _load();
    }
  }

  Widget? _avatar(Map<String, dynamic> c) {
    final url =
        c['user_avatar']?.toString() ?? c['userAvatar']?.toString() ?? '';
    if (url.isEmpty) return null;
    const fallback = _CircleIcon(icon: Icons.person, size: 40);
    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: url,
        width: 40,
        height: 40,
        fit: BoxFit.cover,
        placeholder: (_, _) => fallback,
        errorWidget: (_, _, _) => fallback,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.6,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Text(
                    'Comments',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white12, height: 1),
            Expanded(
              child: _loading
                  ? const Center(child: LoadingSpinner(size: 24))
                  : _error != null
                      ? Center(
                          child: Text(
                            _error!,
                            style: const TextStyle(color: Colors.white54),
                          ),
                        )
                      : _comments.isEmpty
                          ? const Center(
                              child: Text(
                                'No comments yet. Be the first!',
                                style: TextStyle(color: Colors.white54),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              itemCount: _comments.length,
                              itemBuilder: (_, i) {
                                final c = _comments[i];
                                return ListTile(
                                  leading: _avatar(c) ??
                                      const _CircleIcon(icon: Icons.person, size: 40),
                                  title: Text(
                                    c['user_name']?.toString() ??
                                        c['creatorName']?.toString() ??
                                        'User',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  subtitle: Text(
                                    c['text']?.toString() ?? c['comment']?.toString() ?? '',
                                    style: const TextStyle(color: Colors.white70),
                                  ),
                                );
                              },
                            ),
            ),
            const Divider(color: Colors.white12, height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textCtl,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Add a comment...',
                        hintStyle: const TextStyle(color: Colors.white38),
                        filled: true,
                        fillColor: Colors.white10,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      onSubmitted: (_) => _post(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _post,
                    icon: const Icon(Icons.send, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HookFallback extends StatelessWidget {
  const _HookFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceContainer,
      child: const Center(
        child: Icon(Icons.movie, size: 64, color: Colors.grey),
      ),
    );
  }
}

class _CircleIcon extends StatelessWidget {
  final IconData icon;
  final double size;
  final bool border;

  const _CircleIcon({
    required this.icon,
    required this.size,
    this.border = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF404040),
        border: border ? Border.all(color: Colors.white, width: 2) : null,
      ),
      child: Icon(icon, color: Colors.white, size: size * 0.5),
    );
  }
}

class _ActionIcon extends StatelessWidget {
  final IconData icon;
  final int count;
  final VoidCallback onTap;
  final Color? color;

  const _ActionIcon({
    required this.icon,
    required this.count,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: color ?? Colors.white, size: 28),
          const SizedBox(height: 4),
          Text(
            count > 0 ? _formatCount(count) : '',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatCount(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }
}