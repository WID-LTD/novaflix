import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/api_service.dart';

class ClaimVerifyScreen extends ConsumerStatefulWidget {
  final String claimId;
  const ClaimVerifyScreen({super.key, required this.claimId});

  @override
  ConsumerState<ClaimVerifyScreen> createState() => _ClaimVerifyScreenState();
}

class _ClaimVerifyScreenState extends ConsumerState<ClaimVerifyScreen> {
  late final WebViewController _controller;
  String _kycStatus = 'loading'; // loading, pending, approved, declined, error
  String _error = '';
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _initWebView();
    _startPolling();
  }

  void _initWebView() {
    final templateId = const String.fromEnvironment('PERSONA_TEMPLATE_ID', defaultValue: '');
    final environmentId = const String.fromEnvironment('PERSONA_ENV_ID', defaultValue: '');

    if (templateId.isEmpty || environmentId.isEmpty) {
      setState(() {
        _kycStatus = 'error';
        _error = 'Persona configuration missing. Please set PERSONA_TEMPLATE_ID and PERSONA_ENV_ID environment variables.';
      });
      return;
    }

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            debugPrint('Persona page started: $url');
          },
          onPageFinished: (url) {
            debugPrint('Persona page finished: $url');
          },
          onWebResourceError: (error) {
            debugPrint('Persona error: ${error.description}');
          },
        ),
      )
      ..addJavaScriptChannel(
        'PersonaChannel',
        onMessageReceived: (message) {
          debugPrint('Persona message: ${message.message}');
        },
      )
      ..loadRequest(Uri.parse('about:blank'));

    // Initialize Persona Embedded Flow
    controller.runJavaScript('''
      (function() {
        var script = document.createElement('script');
        script.src = 'https://cdn.withpersona.com/persona-web-sdk/v1/persona.js';
        script.async = true;
        document.head.appendChild(script);
        script.onload = function() {
          window.PersonaClient = new Persona.Client({
            templateId: '$templateId',
            referenceId: '$claimId',
            environmentId: '$environmentId',
            onReady: function() { window.PersonaClient.open(); },
            onComplete: function(data) {
              window.PersonaChannel.postMessage(JSON.stringify({ type: 'complete', data: data }));
            },
            onCancel: function(data) {
              window.PersonaChannel.postMessage(JSON.stringify({ type: 'cancel', data: data }));
            },
            onError: function(error) {
              window.PersonaChannel.postMessage(JSON.stringify({ type: 'error', error: error.message }));
            }
          });
        })();
    ''');

    _controller = controller;
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      try {
        final token = await ApiService.getToken();
        final res = await http.get(
          Uri.parse('https://api.nova-flix.com.ng/api/creator/claim/status/${widget.claimId}'),
          headers: {'Authorization': 'Bearer $token'},
        );
        final data = jsonDecode(res.body);
        if (data['success']) {
          final claim = data['claim'];
          if (claim['claim_status'] == 'approved') {
            _pollTimer?.cancel();
            if (mounted) {
              Navigator.pushReplacementNamed(context, '/creator/claim/success');
            }
          } else if (claim['claim_status'] == 'denied') {
            _pollTimer?.cancel();
            setState(() {
              _kycStatus = 'declined';
            });
          }
        }
      } catch (e) {
        debugPrint('Polling error: $e');
      }
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final statusMessages = {
      'loading': {'icon': Icons.hourglass_empty, 'text': 'Loading verification...', 'color': Colors.blue},
      'pending': {'icon': Icons.verified_user, 'text': 'Complete the verification in the window above', 'color': Colors.blue},
      'approved': {'icon': Icons.check_circle, 'text': 'Verification approved! Redirecting...', 'color': Colors.green},
      'declined': {'icon': Icons.cancel, 'text': 'Verification was declined. You can try again.', 'color': Colors.red},
      'error': {'icon': Icons.error, 'text': _error.isNotEmpty ? _error : 'Verification failed. Please try again.', 'color': Colors.red},
    };

    final current = statusMessages[_kycStatus] ?? statusMessages['loading']!;

    return Scaffold(
      appBar: AppBar(title: const Text('Identity Verification')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 24),
            CircleAvatar(
              radius: 48,
              backgroundColor: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.2),
              child: Icon(
                current['icon'] as IconData,
                size: 48,
                color: current['color'] as Color,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Identity Verification',
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              current['text'] as String,
              textAlign: TextAlign.center,
              style: TextStyle(color: current['color'] as Color),
            ),
            const SizedBox(height: 24),
            if (_kycStatus == 'pending') ...[
              Expanded(
                child: WebViewWidget(controller: _controller),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.verified_user, color: Theme.of(context).primaryColor),
                          const SizedBox(width: 8),
                          const Text('Complete Your Verification', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'The Persona verification window should open above. Please complete the following steps:',
                        style: TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 12),
                      _buildStep('Upload a clear photo of your government ID'),
                      _buildStep('Take a selfie for liveness check'),
                      _buildStep('Review and submit'),
                      const SizedBox(height: 12),
                      const Text(
                        'This usually takes 2-3 minutes. Your claim will be automatically approved upon successful verification.',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStep(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, size: 20, color: Colors.green),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 16))),
        ],
      ),
    );
  }
}