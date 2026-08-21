import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../models/notification.dart';
import '../services/api_service.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  
  static Future<void> initialize() async {
    // Request permissions
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    
    // Initialize local notifications
    const AndroidInitializationSettings androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosInit = DarwinInitializationSettings();
    const InitializationSettings initSettings = InitializationSettings(android: androidInit, iOS: iosInit);
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background message taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
    
    // Get FCM token
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerToken(token);
    }
    
    // Listen for token refresh
    _messaging.onTokenRefresh.listen(_registerToken);
  }
  
  static Future<void> _registerToken(String token) async {
    try {
      final userToken = await ApiService.getToken();
      await http.post(
        Uri.parse('${ApiService.baseUrl}/push/subscribe'),
        headers: {
          'Authorization': 'Bearer $userToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'endpoint': token,
          'keys': {
            'p256dh': '',
            'auth': '',
          },
        }),
      );
    } catch (e) {
      debugPrint('Failed to register push token: $e');
    }
  }
  
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    final data = message.data;
    
    if (notification != null) {
      await _showLocalNotification(
        title: notification.title ?? '',
        body: notification.body ?? '',
        payload: jsonEncode(data),
      );
    }
  }
  
  static void _handleMessageOpenedApp(RemoteMessage message) {
    final data = message.data;
    _navigateFromPayload(data);
  }
  
  static void _onNotificationTap(NotificationResponse response) {
    final payload = response.payload;
    if (payload != null) {
      _navigateFromPayload(jsonDecode(payload));
    }
  }
  
  static Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'novaflix_channel',
      'NovaFlix Notifications',
      channelDescription: 'NovaFlix app notifications',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );
    
    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      platformDetails,
      payload: payload,
    );
  }
  
  static void _navigateFromPayload(Map<String, dynamic> data) {
    final type = data['type'];
    final link = data['link'];
    
    if (link != null) {
      // Navigate based on deep link
      // Implementation depends on router setup
    }
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) => NotificationService());

// Notification state provider
class NotificationState {
  final List<AppNotification> notifications;
  final int unreadCount;
  final bool isLoading;
  
  const NotificationState({
    this.notifications = const [],
    this.unreadCount = 0,
    this.isLoading = false,
  });
  
  NotificationState copyWith({
    List<AppNotification>? notifications,
    int? unreadCount,
    bool? isLoading,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final String _baseUrl = 'https://api.nova-flix.com.ng/api';
  
  NotificationNotifier() : super(const NotificationState());
  
  Future<void> loadNotifications({int limit = 30, int offset = 0}) async {
    state = state.copyWith(isLoading: true);
    try {
      final token = await ApiService.getToken();
      final res = await http.get(
        Uri.parse('https://api.nova-flix.com.ng/api/notifications?limit=30&offset=0'),
        headers: {'Authorization': 'Bearer ${await ApiService.getToken()}'},
      );
      final data = jsonDecode(res.body);
      if (data['success']) {
        state = state.copyWith(
          notifications: (data['notifications'] as List).map((e) => AppNotification.fromJson(e)).toList(),
          isLoading: false,
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
  
  Future<void> loadUnreadCount() async {
    try {
      final token = await ApiService.getToken();
      final res = await http.get(
        Uri.parse('https://api.nova-flix.com.ng/api/notifications/unread-count'),
        headers: {'Authorization': 'Bearer ${await ApiService.getToken()}'},
      );
      final data = jsonDecode(res.body);
      if (data['success']) {
        state = state.copyWith(unreadCount: data['count']);
      }
    } catch (e) {
      // ignore
    }
  }
  
  Future<void> markAsRead(String id) async {
    try {
      final token = await ApiService.getToken();
      await http.post(
        Uri.parse('https://api.nova-flix.com.ng/api/notifications/$id/read'),
        headers: {'Authorization': 'Bearer ${await ApiService.getToken()}'},
      );
      state = state.copyWith(
        notifications: state.notifications.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
        unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
      );
    } catch (e) {
      // ignore
    }
  }
  
  Future<void> markAllAsRead() async {
    try {
      final token = await ApiService.getToken();
      await http.post(
        Uri.parse('https://api.nova-flix.com.ng/api/notifications/read-all'),
        headers: {'Authorization': 'Bearer ${await ApiService.getToken()}'},
      );
      state = state.copyWith(
        notifications: state.notifications.map((n) => n.copyWith(isRead: true)).toList(),
        unreadCount: 0,
      );
    } catch (e) {
      // ignore
    }
  }
}

final notificationProvider = StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  return NotificationNotifier(ref.read(apiServiceProvider));
});

// Background message handler for FCM
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handle background messages
  debugPrint('Background message: ${message.messageId}');
}