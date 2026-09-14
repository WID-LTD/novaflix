import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

/// WebView for payment with authorization_url and verifyPayment realtime
/// Handles gateway flutterwave/paystack via hosted checkout URL.
class PaymentWebViewScreen extends StatefulWidget {
  final String authorizationUrl;
  final String reference;
  final String plan;
  final String gateway;

  const PaymentWebViewScreen({
    super.key,
    required this.authorizationUrl,
    required this.reference,
    required this.plan,
    required this.gateway,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _verifying = false;
  bool _handling = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.background)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (request) {
          final url = request.url.toLowerCase();
          // Detect success/callback redirects from flutterwave/paystack hosted pages
          if (url.contains('payment-success') ||
              url.contains('callback') ||
              url.contains('verify') ||
              (widget.reference.isNotEmpty && url.contains(widget.reference.toLowerCase())) ||
              url.contains('status=successful') ||
              url.contains('status=success')) {
            _verifyPaymentRealtime();
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageFinished: (url) {
          final lower = url.toLowerCase();
          if (lower.contains('payment-success') ||
              lower.contains('callback') ||
              (widget.reference.isNotEmpty && lower.contains(widget.reference.toLowerCase()))) {
            _verifyPaymentRealtime();
          }
        },
      ))
      ..loadRequest(Uri.parse(widget.authorizationUrl));
  }

  Future<void> _verifyPaymentRealtime() async {
    if (_handling) return;
    _handling = true;
    if (mounted) setState(() => _verifying = true);
    try {
      final container = ProviderScope.containerOf(context);
      final api = container.read(apiServiceProvider);
      final res = await api.verifyPayment(widget.reference, widget.plan);
      final data = res.data is Map ? res.data as Map : {};
      final success = data['success'] == true || data['status'] == 'success' || res.statusCode == 200;
      if (!mounted) return;
      if (success) {
        Navigator.of(context).pop();
        context.go('/payment-success?reference=${widget.reference}&plan=${widget.plan}');
      } else {
        if (mounted) setState(() => _verifying = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Verification pending. Please wait.')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _verifying = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Verification pending. Please wait.')),
      );
    } finally {
      _handling = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceContainerLowest,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.onSurface),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Secure Payment — ${widget.gateway}', style: const TextStyle(fontSize: 16)),
        actions: [
          if (_verifying)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
            ),
          TextButton(
            onPressed: _verifying ? null : () => _verifyPaymentRealtime(),
            child: const Text('Verify'),
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_verifying)
            Container(
              color: Colors.black.withValues(alpha: 0.4),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    const SizedBox(height: 12),
                    Text('Verifying payment...', style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}