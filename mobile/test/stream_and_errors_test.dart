import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:novaflix/screens/watch_screen.dart';
import 'package:novaflix/services/api_service.dart';

void main() {
  group('resolveStreamUrl', () {
    test('prepends the API origin to relative proxy paths', () {
      expect(
        resolveStreamUrl('/api/proxy/play.xpass.top/path/playlist.m3u8'),
        'https://novaflix-ecz9.onrender.com/api/proxy/play.xpass.top/path/playlist.m3u8',
      );
    });

    test('prepends the API origin to creator upload paths', () {
      expect(
        resolveStreamUrl('/api/stream/creator/abc-123.mp4'),
        'https://novaflix-ecz9.onrender.com/api/stream/creator/abc-123.mp4',
      );
    });

    test('leaves absolute http(s) URLs untouched', () {
      expect(
        resolveStreamUrl('https://cdn.example.com/x/playlist.m3u8'),
        'https://cdn.example.com/x/playlist.m3u8',
      );
    });

    test('returns empty input unchanged', () {
      expect(resolveStreamUrl(''), '');
      expect(resolveStreamUrl('   '), '');
    });
  });

  group('friendlyErrorMessage', () {
    DioException dio(
      DioExceptionType type, {
      int? statusCode,
      Object? body,
      Object? error,
    }) {
      return DioException(
        requestOptions: RequestOptions(path: '/x'),
        type: type,
        response: statusCode == null
            ? null
            : Response(
                requestOptions: RequestOptions(path: '/x'),
                statusCode: statusCode,
                data: body,
              ),
        error: error,
      );
    }

    test('uses the server error message for HTTP responses', () {
      expect(
        friendlyErrorMessage(
          dio(
            DioExceptionType.badResponse,
            statusCode: 401,
            body: {'error': 'Invalid credentials'},
          ),
        ),
        'Invalid credentials',
      );
      expect(
        friendlyErrorMessage(
          dio(
            DioExceptionType.badResponse,
            statusCode: 409,
            body: {'error': 'Email already registered'},
          ),
        ),
        'Email already registered',
      );
    });

    test('maps timeouts to a connection hint', () {
      final msg = friendlyErrorMessage(dio(DioExceptionType.connectionTimeout));
      expect(msg, contains("Can't connect to the server"));
      expect(msg, contains('internet connection'));
    });

    test('maps connection refused to a server-down message', () {
      final msg = friendlyErrorMessage(
        dio(
          DioExceptionType.connectionError,
          error: Exception('SocketException: Connection refused'),
        ),
      );
      expect(msg, "Can't connect to the server. Please try again later.");
    });

    test('maps generic connection errors to a no-internet message', () {
      final msg = friendlyErrorMessage(
        dio(
          DioExceptionType.connectionError,
          error: Exception('SocketException: Network is unreachable'),
        ),
      );
      expect(
        msg,
        'No internet connection. Check your connection and try again.',
      );
    });

    test('falls back to a generic message', () {
      expect(
        friendlyErrorMessage(Exception('boom')),
        'Something went wrong. Please try again.',
      );
    });
  });
}
