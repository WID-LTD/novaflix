import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

class ClaimStatusScreen extends ConsumerStatefulWidget {
  final String claimId;
  const ClaimStatusScreen({super.key, required this.claimId});

  @override
  ConsumerState<ClaimStatusScreen> createState() => _ClaimStatusScreenState();
}

class _ClaimStatusScreenState extends ConsumerState<ClaimStatusScreen> {
  Map<String, dynamic>? _claim;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _startPolling();
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
          setState(() => _claim = data['claim']);
          if (data['claim']['claim_status'] == 'approved') {
            _pollTimer?.cancel();
            if (mounted) {
              Navigator.pushReplacementNamed(context, '/creator/claim/success');
            }
          } else if (data['claim']['claim_status'] == 'denied') {
            _pollTimer?.cancel();
            setState(() {});
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
    if (_claim == null) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Checking claim status...'),
            ],
          ),
        );
      );
    }

    final statusConfig = {
      'pending': {'icon': Icons.hourglass_empty, 'text': 'Verification in Progress', 'color': Colors.blue, 'bg': 'bg-blue-50'},
      'approved': {'icon': Icons.check_circle, 'text': 'Claim Approved!', 'color': Colors.green, 'bg': 'bg-green-50'},
      'denied': {'icon': Icons.cancel, 'text': 'Claim Denied', 'color': Colors.red, 'bg': 'bg-red-50'},
    };

    final config = statusConfig[_claim!['claim_status']] ?? {
      'icon': Icons.hourglass_empty,
      'text': 'Processing...',
      'color': Colors.blue,
      'bg': 'bg-blue-50',
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Claim Status')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 64,
                backgroundColor: (config['color'] as Color).withOpacity(0.1),
                child: Icon(config['icon'] as IconData, size: 64, color: config['color'] as Color),
              ),
              const SizedBox(height: 24),
              Text(
                config['text'] as String,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: config['color'] as Color,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Claim ID: ${widget.claimId.substring(0, 8)}...',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              if (_claim!['claim_status'] == 'pending') ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        const Icon(Icons.hourglass_empty, size: 48, color: Colors.blue),
                        const SizedBox(height: 16),
                        const Text('Verification in Progress', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        const Text(
                          'Persona verification in progress. Automatic approval upon successful verification.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey),
                        ),
                        const SizedBox(height: 16),
                        const Text('This page will automatically redirect when complete.', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  ),
                ),
              if (config['icon'] == Icons.cancel) ...[
                Card(
                  color: Colors.red[50],
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        const Icon(Icons.cancel, size: 48, color: Colors.red),
                        const SizedBox(height: 16),
                        const Text('Claim Denied', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red)),
                        const SizedBox(height: 8),
                        const Text('Your claim was not approved. This could be due to verification failure or the profile being already claimed.'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => Navigator.pushReplacementNamed(context, '/creator/claim/start'),
                          child: const Text('Try Again'),
                        ),
                      ],
                    ),
                  ),
                ),
              if (config['icon'] == Icons.check_circle) ...[
                FilledButton.icon(
                  onPressed: () => Navigator.pushReplacementNamed(context, '/creator/onboarding'),
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('Continue to Wallet Setup'),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}