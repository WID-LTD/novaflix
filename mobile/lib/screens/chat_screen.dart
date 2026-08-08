import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../services/ws_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';

final _conversationsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getConversations();
  final data = res.data is Map
      ? Map<String, dynamic>.from(res.data as Map)
      : <String, dynamic>{};
  final list =
      (data['conversations'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ??
      <Map<String, dynamic>>[];
  return list;
});

class ChatScreen extends ConsumerStatefulWidget {
  final int? otherUserId;
  final String? otherUserName;

  const ChatScreen({super.key, this.otherUserId, this.otherUserName});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;
  final _chatCtl = TextEditingController();
  final _scrollCtl = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  bool _connected = false;
  bool _loading = true;
  String? _error;
  int? _myId;
  String? _otherName;

  @override
  void initState() {
    super.initState();
    _myId = ref.read(authProvider).user?.id;
    _otherName = widget.otherUserName;
    if (widget.otherUserId != null) {
      _connect();
      _loadRest();
    }
  }

  Future<void> _connect() async {
    try {
      final channel = await WsService.connect('/ws');
      if (!mounted) {
        channel.sink.close();
        return;
      }
      _channel = channel;
      _sub = channel.stream.listen(
        (data) {
          Map<String, dynamic>? msg;
          if (data is String) {
            try {
              final decoded = jsonDecode(data);
              if (decoded is Map) msg = Map<String, dynamic>.from(decoded);
            } catch (_) {}
          } else if (data is Map) {
            msg = Map<String, dynamic>.from(data);
          }
          if (msg != null) _handleWs(msg);
        },
        onError: (_) {
          if (!mounted) return;
          setState(() {
            _connected = false;
            _error = 'Connection lost';
            _loading = false;
          });
        },
        onDone: () {
          if (mounted) setState(() => _connected = false);
        },
      );
      setState(() {
        _connected = true;
        _error = null;
      });
      channel.sink.add(
        jsonEncode({'type': 'dm-join', 'otherUserId': widget.otherUserId!}),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _connected = false;
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadRest() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.getDirectMessages(widget.otherUserId!);
      final data = res.data is Map
          ? Map<String, dynamic>.from(res.data as Map)
          : <String, dynamic>{};
      final other = data['otherUser'] is Map
          ? Map<String, dynamic>.from(data['otherUser'] as Map)
          : null;
      final list =
          (data['messages'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          <Map<String, dynamic>>[];
      if (!mounted) return;
      setState(() {
        if (_otherName == null && other != null) {
          _otherName = other['name']?.toString();
        }
        if (_messages.isEmpty) {
          _messages = list;
          _loading = false;
          _error = null;
        }
      });
      if (_messages.isEmpty) _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      if (_messages.isEmpty) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  void _handleWs(Map<String, dynamic> msg) {
    switch (msg['type']) {
      case 'joined':
        break;
      case 'chat-history':
        final list =
            (msg['messages'] as List?)
                ?.map((e) => Map<String, dynamic>.from(e as Map))
                .toList() ??
            <Map<String, dynamic>>[];
        _replaceMessages(list);
        break;
      case 'chat':
        _appendMessage(msg);
        break;
    }
  }

  void _replaceMessages(List<Map<String, dynamic>> list) {
    if (!mounted) return;
    setState(() {
      _messages = list;
      _loading = false;
      _error = null;
    });
    _scrollToBottom();
  }

  void _appendMessage(Map<String, dynamic> m) {
    if (!mounted) return;
    final id = m['id'];
    if (id != null && _messages.any((x) => x['id'] == id)) return;
    setState(() {
      _messages.add(m);
      _loading = false;
      _error = null;
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollCtl.hasClients) return;
      _scrollCtl.jumpTo(_scrollCtl.position.maxScrollExtent);
    });
  }

  void _send() {
    final text = _chatCtl.text.trim();
    if (text.isEmpty) return;
    final channel = _channel;
    if (!_connected || channel == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Connecting…')));
      return;
    }
    final name = ref.read(authProvider).user?.username ?? 'User';
    channel.sink.add(
      jsonEncode({'type': 'dm-chat', 'message': text, 'name': name}),
    );
    _chatCtl.clear();
  }

  bool _isIncoming(Map<String, dynamic> m) {
    final uid = _intField(m, 'userId');
    if (_myId != null && uid != null) return uid != _myId;
    if (uid != null) return uid != widget.otherUserId;
    return false;
  }

  int? _intField(Map<String, dynamic> m, String key) {
    final v = m[key];
    if (v is int) return v;
    if (v is num) return v.toInt();
    return null;
  }

  String _messageText(Map<String, dynamic> m) => m['message']?.toString() ?? '';

  String _timeText(Object? t) {
    if (t == null) return '';
    if (t is num)
      return _clock(DateTime.fromMillisecondsSinceEpoch(t.toInt()).toLocal());
    final s = t.toString();
    if (s.isEmpty) return '';
    final iso = DateTime.tryParse(s);
    if (iso != null) return _clock(iso.toLocal());
    final ms = int.tryParse(s);
    if (ms != null)
      return _clock(DateTime.fromMillisecondsSinceEpoch(ms).toLocal());
    return '';
  }

  String _clock(DateTime dt) {
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final ap = dt.hour < 12 ? 'AM' : 'PM';
    return '$h:${dt.minute.toString().padLeft(2, '0')} $ap';
  }

  String _relativeTime(Object? t) {
    if (t == null) return '';
    if (t is num)
      return _relative(
        DateTime.fromMillisecondsSinceEpoch(t.toInt()).toLocal(),
      );
    final s = t.toString();
    if (s.isEmpty) return '';
    final iso = DateTime.tryParse(s);
    if (iso != null) return _relative(iso.toLocal());
    final ms = int.tryParse(s);
    if (ms != null)
      return _relative(DateTime.fromMillisecondsSinceEpoch(ms).toLocal());
    return '';
  }

  String _relative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()}mo ago';
    return '${(diff.inDays / 365).floor()}y ago';
  }

  @override
  void dispose() {
    _sub?.cancel();
    _channel?.sink.close();
    _chatCtl.dispose();
    _scrollCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.otherUserId != null ? (_otherName ?? 'Messages') : 'Messages',
        ),
      ),
      body: widget.otherUserId != null ? _buildThread() : _buildConversations(),
    );
  }

  Widget _buildConversations() {
    final conversations = ref.watch(_conversationsProvider);
    return conversations.when(
      data: (items) => items.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.chat_bubble_outline,
                    size: 64,
                    color: AppColors.onSurfaceVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No conversations yet',
                    style: AppTypography.bodyMd.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (_, i) => _ConversationTile(item: items[i]),
            ),
      loading: () => const LoadingSpinner(logo: true),
      error: (e, _) => Center(
        child: Text(
          'Error: $e',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
    );
  }

  Widget _buildThread() {
    return Column(
      children: [
        Expanded(child: _buildMessages()),
        _buildInput(),
      ],
    );
  }

  Widget _buildMessages() {
    if (_loading) return const LoadingSpinner(logo: true);
    if (_messages.isEmpty && _error != null) {
      return Center(
        child: Text(
          'Error: $_error',
          style: const TextStyle(color: AppColors.error),
        ),
      );
    }
    if (_messages.isEmpty) {
      return Center(
        child: Text(
          'No messages yet. Say hi!',
          style: AppTypography.bodyMd.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
      );
    }
    return ListView.builder(
      controller: _scrollCtl,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      itemCount: _messages.length,
      itemBuilder: (_, i) {
        final m = _messages[i];
        final isMine = !_isIncoming(m);
        final time = _timeText(m['timestamp'] ?? m['created_at']);
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Align(
            alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
            child: Column(
              crossAxisAlignment: isMine
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isMine
                        ? AppColors.primary
                        : AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    _messageText(m),
                    style: TextStyle(
                      color: isMine ? AppColors.onPrimary : AppColors.onSurface,
                    ),
                  ),
                ),
                if (time.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4, left: 8, right: 8),
                    child: Text(
                      time,
                      style: const TextStyle(
                        color: AppColors.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      decoration: const BoxDecoration(color: AppColors.surfaceContainer),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _chatCtl,
                style: const TextStyle(color: AppColors.onSurface),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: InputDecoration(
                  hintText: 'Send a message…',
                  hintStyle: TextStyle(color: AppColors.onSurfaceVariant),
                  filled: true,
                  fillColor: AppColors.surfaceContainerHigh,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _send,
              style: IconButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.onPrimary,
              ),
              icon: const Icon(Icons.send),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConversationTile extends ConsumerWidget {
  final Map<String, dynamic> item;

  const _ConversationTile({required this.item});

  int? _intField(String key) {
    final v = item[key];
    if (v is int) return v;
    if (v is num) return v.toInt();
    return null;
  }

  String _relativeTime(Object? t) {
    if (t == null) return '';
    DateTime? dt;
    if (t is int) {
      dt = DateTime.fromMillisecondsSinceEpoch(t);
    } else if (t is String) {
      dt = DateTime.tryParse(t);
    }
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId =
        _intField('userId') ?? _intField('user_id') ?? _intField('id');
    final name = item['name']?.toString() ?? 'User';
    final avatar = item['avatar'];
    final lastMessage =
        item['lastMessage']?.toString() ??
        item['last_message']?.toString() ??
        '';
    final lastTime = item['lastMessageTime'] ?? item['last_message_at'];

    return GestureDetector(
      onTap: userId == null ? null : () => context.push('/chat?with=$userId'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.surfaceContainerHighest,
              backgroundImage: avatar != null
                  ? NetworkImage(avatar.toString())
                  : null,
              child: avatar == null
                  ? const Icon(Icons.person, color: AppColors.onSurfaceVariant)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: AppTypography.bodyMd.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (lastTime != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          _relativeTime(lastTime),
                          style: const TextStyle(
                            color: AppColors.onSurfaceVariant,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (lastMessage.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      lastMessage,
                      style: AppTypography.bodySm.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
