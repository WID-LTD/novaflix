import 'package:flutter_test/flutter_test.dart';
import 'package:novaflix/models/user.dart';

void main() {
  group('User.fromJson with UUID ids (regression: type string error)', () {
    test('parses a UUID string id from /auth/me and /auth/login responses', () {
      final json = {
        'id': 'a4c2a0f8-0000-4000-8000-000000000001',
        'email': 'test@example.com',
        'name': 'Test User',
        'role': 'user',
        'plan': 'free',
      };

      final user = User.fromJson(json, token: 'jwt-token');

      expect(user.id, 'a4c2a0f8-0000-4000-8000-000000000001');
      expect(user.username, 'Test User');
      expect(user.email, 'test@example.com');
      expect(user.token, 'jwt-token');
    });

    test('parses a login response userId as string (no String->int crash)', () {
      final loginData = {
        'token': 'abc.def.ghi',
        'user': {
          'id': 'b7f3b1e0-1111-4111-8111-111111111112',
          'email': 'actor@example.com',
          'name': 'Actor',
          'role': 'creator',
        },
      };

      final user = User.fromJson(
        loginData['user'] as Map<String, dynamic>,
        token: loginData['token'] as String,
      );

      expect(user.id, 'b7f3b1e0-1111-4111-8111-111111111112');
      expect(user.isCreator, isTrue);
      expect(user.isAuthenticated, isTrue);
    });
  });
}
