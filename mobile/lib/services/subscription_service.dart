import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/subscription_plan.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../screens/subscription_activated_screen.dart';
import '../theme/app_colors.dart';
import '../widgets/subscription/securing_dialog.dart';
import '../services/api_service.dart';
import '../widgets/subscription/payment_webview.dart';

/// Robust checkout using **Flutterwave Standard web redirect**.
/// - Uses server-side initialization to get authorization URL
/// - Opens Flutterwave hosted payment page in WebView (like Paystack)
/// - Ties user to Flutterwave Dashboard recurring plan via payment_plan
Future<void> executeInAppSubscription(
  BuildContext context,
  SubscriptionPlan selectedPlan, {
  WidgetRef? ref,
}) async {
  final container = ProviderScope.containerOf(context, listen: false);
  final authState = container.read(authProvider);
  final user = container.read(authProvider).user;

  // Dynamic customer profile from authProvider.user (require login)
  if (user == null) {
    if (context.mounted) context.go('/login?redirect=/pricing');
    return;
  }

  // 1) Dark loading overlay — bridges safely to checkout sheet
  showDialog(
    context: context,
    barrierDismissible: false,
    barrierColor: Colors.black54,
    builder: (_) => const SecuringMoviePassDialog(),
  );

  try {
    // 1) Initialize payment on server to get authorization URL
    final api = ProviderScope.containerOf(context, listen: false).read(apiServiceProvider);
    final initRes = await api.initializePayment(
      selectedPlan.slug,
      gateway: 'flutterwave',
      promoCode: null,
    );
    
    if (!context.mounted) return;
    Navigator.of(context, rootNavigator: true).pop(); // dismiss loading dialog

    final body = initRes.data is Map<String, dynamic> 
        ? initRes.data as Map<String, dynamic> 
        : <String, dynamic>{};
    final url = body['authorization_url']?.toString();
    final reference = body['reference']?.toString() ?? '';
    
    if (url == null || url.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to initialize payment. Please try again.'),
            backgroundColor: Color(0xFF2A0B0B),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    }

    // Navigate to WebView payment screen (like Paystack flow)
    if (context.mounted) {
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => PaymentWebViewScreen(
            authorizationUrl: url,
            reference: reference,
            plan: selectedPlan.slug,
            gateway: 'flutterwave',
          ),
        ),
      );
    }
  } catch (e) {
    try {
      if (context.mounted) Navigator.of(context, rootNavigator: true).pop();
    } catch (_) {}

    if (!context.mounted) return;
    final msg = e.toString().split(':').last.trim();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Oops — $msg', maxLines: 2, overflow: TextOverflow.ellipsis),
        backgroundColor: const Color(0xFF2A0B0B),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}

String planIntervalLabel(SubscriptionPlan plan) => 'Monthly ${plan.name}';