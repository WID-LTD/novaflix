import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';
import '../services/api_service.dart';

class WatchPartyScreen extends ConsumerStatefulWidget {
  const WatchPartyScreen({super.key});

  @override
  ConsumerState<WatchPartyScreen> createState() => _WatchPartyScreenState();
}

class _WatchPartyScreenState extends ConsumerState<WatchPartyScreen> {
  WebSocketChannel? _channel;
  final _roomCtl = TextEditingController();
  final _chatCtl = TextEditingController();
  bool _joined = false;
  String? _roomCode;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _messages = [];

  void _connect(String room) async {
    final token = await ref.read(apiServiceProvider).getToken() ?? '';
    final host = 'ws://10.0.2.2:5001/ws?token=$token';
    _channel = WebSocketChannel.connect(Uri.parse(host));
    _channel!.stream.listen((data) {
      final msg = jsonDecode(data as String) as Map<String, dynamic>;
      _handleMessage(msg);
    });
    _channel!.sink.add(jsonEncode({'type': 'join', 'room': room}));
    setState(() { _joined = true; _roomCode = room; });
  }

  void _handleMessage(Map<String, dynamic> msg) {
    switch (msg['type']) {
      case 'joined':
      case 'user-joined':
        setState(() => _users = (msg['users'] as List?)?.cast<Map<String, dynamic>>() ?? _users);
        break;
      case 'user-left':
        setState(() => _users = _users.where((u) => u['id'] != msg['userId']).toList());
        break;
      case 'chat':
        setState(() => _messages.add(msg['payload'] as Map<String, dynamic>));
        break;
    }
  }

  void _sendChat() {
    if (_chatCtl.text.isEmpty || _roomCode == null) return;
    _channel!.sink.add(jsonEncode({
      'type': 'chat', 'room': _roomCode!,
      'payload': {'message': _chatCtl.text, 'name': ref.read(authProvider).user?.username ?? 'User'},
    }));
    _chatCtl.clear();
  }

  @override
  void dispose() {
    _channel?.sink.close();
    _roomCtl.dispose();
    _chatCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final rank = user?.planRank ?? 0;
    final hasAccess = rank >= 3;

    if (!_joined) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Watch Party')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.people, size: 80, color: hasAccess ? AppColors.primary : AppColors.onSurfaceVariant),
                const SizedBox(height: 24),
                Text('Watch Together', style: AppTypography.headlineMd),
                const SizedBox(height: 8),
                Text(hasAccess ? 'Create or join a watch party' : 'Premium feature - upgrade to access',
                  style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ),
                if (hasAccess) ...[
                  const SizedBox(height: 32),
                  AppButton(label: 'Create Party', onPressed: () => _connect('room_${DateTime.now().millisecondsSinceEpoch}')),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: AppInput(controller: _roomCtl, label: 'Room Code', hint: 'Enter room code')),
                      const SizedBox(width: 12),
                      AppButton(label: 'Join', onPressed: _roomCtl.text.isNotEmpty ? () => _connect(_roomCtl.text) : null,
                        fullWidth: false, height: 48),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(title: Text('Party: $_roomCode')),
      body: Column(
        children: [
          Expanded(
            child: Container(
              color: Colors.grey[900],
              child: Center(child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.tv, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text('Waiting to start...', style: TextStyle(color: Colors.grey[400])),
                ],
              )),
            ),
          ),
          Container(
            height: 200,
            color: AppColors.surfaceContainer,
            child: Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) {
                      final m = _messages[i];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Text('${m['name'] ?? 'User'}: ${m['message'] ?? ''}',
                          style: const TextStyle(color: Colors.white, fontSize: 13)),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _chatCtl,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: 'Send a message...',
                            hintStyle: TextStyle(color: Colors.grey[500]),
                            filled: true,
                            fillColor: Colors.grey[800],
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          ),
                          onSubmitted: (_) => _sendChat(),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.send, color: AppColors.primary),
                        onPressed: _sendChat,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
