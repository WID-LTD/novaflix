import 'dart:io' show Platform, File;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:media_kit/media_kit.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'services/notification_service.dart';
import 'app.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load .env file from the executable's directory
  final executableDir = File(Platform.resolvedExecutable).parent;
  final envFile = File('${executableDir.path}/.env');
  await dotenv.load(fileName: envFile.path);
  
  MediaKit.ensureInitialized();

  final isLinuxDesktop = Platform.isLinux && !kIsWeb;
  if (!isLinuxDesktop) {
    await Firebase.initializeApp();
    await NotificationService.initialize();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }
  
  runApp(const ProviderScope(child: NovaflixApp()));
}