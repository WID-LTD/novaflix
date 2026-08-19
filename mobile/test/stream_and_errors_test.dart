import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:novaflix/screens/watch_screen.dart';
import 'package:novaflix/services/api_service.dart';

void main() {
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
