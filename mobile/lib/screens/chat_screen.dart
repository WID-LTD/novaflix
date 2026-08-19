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
  final String? otherUserId;
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
  String? _myId;
  String? _otherName;
  String? _otherAvatar;
  String? _activeUserId;

  @override
  void initState() {
    super.initState();
    _myId = ref.read(authProvider).user?.id;
    _otherName = widget.otherUserName;
    _activeUserId = widget.otherUserId;
    if (widget.otherUserId != null) {
      _connect();
      _loadRest();
    }
  }

  @override
  void dispose() {
    _disconnect();
    _chatCtl.dispose();
    _scrollCtl.dispose();
    super.dispose();
  }

  void _disconnect() {
    _sub?.cancel();
    _channel?.sink.close();
    _sub = null;
    _channel = null;
  }

  void _openConversation(Map<String, dynamic> conv) {
    final other = conv['otherUser'];
    if (other is Map) {
      setState(() {
        _activeUserId = other['id']?.toString();
        _otherName = other['name']?.toString();
        _otherAvatar = other['avatar']?.toString();
        _messages = [];
        _loading = true;
        _error = null;
      });
    } else {
      final id =
          conv['userId']?.toString() ??
          conv['user_id']?.toString() ??
          conv['id']?.toString();
      if (id == null) return;
      setState(() {
        _activeUserId = id;
        _otherName = conv['name']?.toString();
        _otherAvatar = conv['avatar']?.toString();
        _messages = [];
        _loading = true;
        _error = null;
      });
    }
    _disconnect();
    _connect();
    _loadRest();
  }

  Future<void> _connect() async {
    final userId = _activeUserId;
    if (userId == null) return;
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
        jsonEncode({'type': 'dm-join', 'otherUserId': userId}),
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
    final userId = _activeUserId;
    if (userId == null) return;
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.getDirectMessages(userId);
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
        if (_otherAvatar == null && other != null) {
          _otherAvatar = other['avatar']?.toString();
        }
        _messages = list;
        _loading = false;
        _error = null;
      });
      _scrollToBottom();
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
        ref.invalidate(_conversationsProvider);
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
    final uid = _stringField(m, 'userId');
    if (_myId != null && uid != null) return uid != _myId;
    if (uid != null) return uid != _activeUserId;
    return false;
  }

  String? _stringField(Map<String, dynamic> m, String key) {
    final v = m[key];
    if (v == null) return null;
    return v.toString();
  }

  String _messageText(Map<String, dynamic> m) => m['message']?.toString() ?? '';

  String _senderName(Map<String, dynamic> m) =>
      m['name']?.toString() ?? '';

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
      return _relative(DateTime.fromMillisecondsSinceEpoch(t.toInt()).toLocal());
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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: [
                  const Icon(Icons.chat_bubble, size: 22, color: AppColors.primaryContainer),
                  const SizedBox(width: 10),
                  Text('Messages', style: AppTypography.headlineMd),
                ],
              ),
            ),
            Expanded(child: _buildLayout()),
          ],
        ),
      ),
    );
  }

  Widget _buildLayout() {
    final width = MediaQuery.sizeOf(context).width;
    if (width >= 900) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(width: 320, child: _buildConversations()),
          const SizedBox(width: 12),
          Expanded(child: _buildThread()),
        ],
      );
    }
    return _activeUserId != null ? _buildThread() : _buildConversations();
  }

  Widget _buildConversations() {
    final conversations = ref.watch(_conversationsProvider);
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              'Conversations',
              style: AppTypography.labelMd.copyWith(
                color: AppColors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: conversations.when(
              loading: () => ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: 4,
                itemBuilder: (_, i) => Container(
                  height: 48,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              error: (e, _) => Center(
                child: Text(
                  'Error: $e',
                  style: const TextStyle(color: AppColors.error),
                ),
              ),
              data: (items) => items.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(
                        child: Text(
                          'No conversations yet. Open a profile and press "Message" to start a chat.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.onSurfaceVariant,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    )
                  : ListView.builder(
                      itemCount: items.length,
                      itemBuilder: (_, i) =>
                          _ConversationRow(
                            item: items[i],
                            active: _isActive(items[i]),
                            onTap: () => _openConversation(items[i]),
                          ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  bool _isActive(Map<String, dynamic> item) {
    final other = item['otherUser'];
    if (other is Map) return other['id']?.toString() == _activeUserId;
    final id =
        item['userId']?.toString() ??
        item['user_id']?.toString() ??
        item['id']?.toString();
    return id == _activeUserId;
  }

  Widget _buildThread() {
    if (_activeUserId == null) {
      return Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
        ),
        child: const Center(
          child: Text(
            'Select a conversation to start messaging',
            style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13),
          ),
        ),
      );
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _threadHeader(),
          Expanded(child: _buildMessages()),
          _buildInput(),
        ],
      ),
    );
  }

  Widget _threadHeader() {
    final name = _otherName ?? 'Loading…';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _avatar(_otherAvatar, 32),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          InkWell(
            onTap: () => context.push('/user/${_activeUserId}'),
            child: Text(
              'View profile',
              style: AppTypography.bodySm.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _avatar(String? avatar, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        shape: BoxShape.circle,
      ),
      clipBehavior: Clip.antiAlias,
      child: avatar != null && avatar.isNotEmpty
          ? Image.network(
              avatar,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) =>
                  const Icon(Icons.person, color: AppColors.onSurfaceVariant),
            )
          : const Icon(Icons.person, color: AppColors.onSurfaceVariant),
    );
  }

  Widget _buildMessages() {
    if (_loading) return const LoadingSpinner();
    if (_messages.isEmpty && _error != null) {
      return Center(
        child: Text(
          'Error: $_error',
          style: const TextStyle(color: AppColors.error),
        ),
      );
    }
    if (_messages.isEmpty) {
      return const Center(
        child: Text(
          'Say hello 👋',
          style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13),
        ),
      );
    }
    return ListView.builder(
      controller: _scrollCtl,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length,
      itemBuilder: (_, i) {
        final m = _messages[i];
        final isMine = !_isIncoming(m);
        final time = _timeText(m['timestamp'] ?? m['created_at']);
        final sender = isMine ? '' : _senderName(m);
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Align(
            alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.sizeOf(context).width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isMine
                    ? AppColors.primaryContainer
                    : AppColors.surfaceContainer,
                borderRadius: BorderRadius.circular(16),
                border: isMine
                    ? null
                    : Border.all(color: AppColors.white.withValues(alpha: 0.1)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (sender.isNotEmpty)
                    Text(
                      sender,
                      style: const TextStyle(
                        color: AppColors.onSurfaceVariant,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  Text(
                    _messageText(m),
                    style: TextStyle(
                      color: isMine
                          ? AppColors.onPrimaryContainer
                          : AppColors.onSurface,
                      fontSize: 14,
                    ),
                  ),
                  if (time.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        time,
                        style: TextStyle(
                          color: isMine
                              ? AppColors.onPrimaryContainer
                              : AppColors.onSurfaceVariant,
                          fontSize: 10,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: AppColors.white.withValues(alpha: 0.1),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _chatCtl,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(color: AppColors.onSurface, fontSize: 14),
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(),
              decoration: InputDecoration(
                hintText: 'Type a message…',
                hintStyle: TextStyle(
                  color: AppColors.onSurfaceVariant.withValues(alpha: 0.5),
                ),
                filled: true,
                fillColor: AppColors.surfaceContainer,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(9),
                  borderSide: BorderSide(
                    color: AppColors.white.withValues(alpha: 0.1),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(9),
                  borderSide: BorderSide(
                    color: AppColors.white.withValues(alpha: 0.1),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: _chatCtl.text.trim().isEmpty ? null : _send,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primaryContainer,
              foregroundColor: AppColors.onPrimaryContainer,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              disabledBackgroundColor: AppColors.surfaceContainerHighest,
            ),
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }
}

class _ConversationRow extends ConsumerWidget {
  final Map<String, dynamic> item;
  final bool active;
  final VoidCallback onTap;

  const _ConversationRow({
    required this.item,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final other = item['otherUser'];
    String? userId;
    String name = 'User';
    String? avatar;
    if (other is Map) {
      userId = other['id']?.toString();
      name = other['name']?.toString() ?? name;
      avatar = other['avatar']?.toString();
    } else {
      userId =
          item['userId']?.toString() ??
          item['user_id']?.toString() ??
          item['id']?.toString();
      name = item['name']?.toString() ?? name;
      avatar = item['avatar']?.toString();
    }
    final lastMessage =
        item['lastMessage']?.toString() ??
        item['last_message']?.toString() ??
        '';
    final lastAt = item['lastAt'] ?? item['last_message_at'];
    final lastDate = _lastDate(lastAt);

    return InkWell(
      onTap: onTap,
      child: Container(
        color: active
            ? AppColors.primary.withValues(alpha: 0.1)
            : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainer,
                shape: BoxShape.circle,
              ),
              clipBehavior: Clip.antiAlias,
              child: avatar != null && avatar.isNotEmpty
                  ? Image.network(
                      avatar,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.person,
                        size: 20,
                        color: AppColors.onSurfaceVariant,
                      ),
                    )
                  : const Icon(
                      Icons.person,
                      size: 20,
                      color: AppColors.onSurfaceVariant,
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: AppTypography.labelMd.copyWith(
                      color: AppColors.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (lastMessage.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      lastMessage,
                      style: TextStyle(
                        color: AppColors.onSurfaceVariant.withValues(alpha: 0.6),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            if (lastDate.isNotEmpty) ...[
              const SizedBox(width: 8),
              Text(
                lastDate,
                style: const TextStyle(
                  color: AppColors.onSurfaceVariant,
                  fontSize: 10,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _lastDate(Object? t) {
    if (t == null) return '';
    DateTime? dt;
    if (t is num) {
      dt = DateTime.fromMillisecondsSinceEpoch(t.toInt()).toLocal();
    } else {
      dt = DateTime.tryParse(t.toString());
    }
    if (dt == null) return '';
    final now = DateTime.now();
    if (dt.year == now.year &&
        dt.month == now.month &&
        dt.day == now.day) {
      return 'Today';
    }
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}