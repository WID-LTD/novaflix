import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/config.dart';

/// Lightweight WebSocket helper for realtime features (DMs, forum replies, notifications).
/// Derives the ws/wss base URL from [AppConfig] and attaches the auth token.
class WsService {
  static const _storage = FlutterSecureStorage();

  static Uri _uri(String path) {
    final base = AppConfig.apiBaseUrl;
    final isHttps = base.startsWith('https://');
    final rest = base.replaceFirst(RegExp(r'^https?://'), '');
    final hostPort = rest.split('/').first;
    final scheme = isHttps ? 'wss' : 'ws';
    return Uri.parse('$scheme://$hostPort$path');
  }

  static Future<WebSocketChannel> connect(String path) async {
    final token = await _storage.read(key: 'novaflix-token');
    final cToken = await _storage.read(key: 'novaflix-creator-token');
    final t = token ?? cToken;
    final uri = _uri(
      path,
    ).replace(queryParameters: t != null && t.isNotEmpty ? {'token': t} : null);
    return WebSocketChannel.connect(uri);
  }

  static Future<WebSocketChannel> connectWithToken(
    String path,
    String? token,
  ) async {
    final uri = _uri(path).replace(
      queryParameters: token != null && token.isNotEmpty
          ? {'token': token}
          : null,
    );
    return WebSocketChannel.connect(uri);
  }
}
