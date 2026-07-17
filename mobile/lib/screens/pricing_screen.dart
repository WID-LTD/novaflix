import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class PricingScreen extends StatelessWidget {
  const PricingScreen({super.key});

  static const _plans = [
    {'name': 'Basic', 'price': '\$9.99', 'quality': 'HD', 'devices': '1 Device'},
    {'name': 'Standard', 'price': '\$15.99', 'quality': 'Full HD', 'devices': '2 Devices'},
    {'name': 'Premium', 'price': '\$22.99', 'quality': '4K + HDR', 'devices': '4 Devices'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Choose Your Plan')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 32),
            Text('Upgrade to Premium', style: TextStyle(
              fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.white.withValues(alpha: 0.95),
            )),
            const SizedBox(height: 8),
            Text('Unlock exclusive content and features', style: const TextStyle(color: AppTheme.gray, fontSize: 15)),
            const SizedBox(height: 40),
            ..._plans.map((plan) => _PlanCard(
              name: plan['name']!,
              price: plan['price']!,
              quality: plan['quality']!,
              devices: plan['devices']!,
              isPopular: plan['name'] == 'Standard',
            )),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String name;
  final String price;
  final String quality;
  final String devices;
  final bool isPopular;

  const _PlanCard({required this.name, required this.price, required this.quality, required this.devices, this.isPopular = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isPopular ? AppTheme.red.withValues(alpha: 0.1) : AppTheme.card,
        borderRadius: BorderRadius.circular(12),
        border: isPopular ? Border.all(color: AppTheme.red, width: 1.5) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.white)),
              const Spacer(),
              if (isPopular) Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: AppTheme.red, borderRadius: BorderRadius.circular(4)),
                child: const Text('POPULAR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.white)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(price, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppTheme.white)),
          const SizedBox(height: 4),
          Text('/month', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))),
          const SizedBox(height: 16),
          _Bullet(text: '$quality supported'),
          _Bullet(text: 'Watch on $devices'),
          _Bullet(text: 'No ads'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: isPopular ? AppTheme.red : AppTheme.card,
                foregroundColor: AppTheme.white,
                side: isPopular ? BorderSide.none : const BorderSide(color: AppTheme.gray),
              ),
              child: Text(isPopular ? 'Subscribe' : 'Choose $name'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bullet extends StatelessWidget {
  final String text;
  const _Bullet({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          const Icon(Icons.check, size: 18, color: AppTheme.red),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: AppTheme.gray, fontSize: 14)),
        ],
      ),
    );
  }
}
