import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';

class PricingScreen extends StatelessWidget {
  const PricingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Plans & Pricing')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            Text('Choose Your Plan', style: AppTypography.headlineMd),
            const SizedBox(height: 8),
            Text('Unlock premium features', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 32),
            _planCard(context, 'Basic', '\$9.99', '720p', '1 Device', '1 Download', false),
            const SizedBox(height: 16),
            _planCard(context, 'Standard', '\$15.99', '1080p', '2 Devices', '2 Downloads', true, isPopular: true),
            const SizedBox(height: 16),
            _planCard(context, 'Premium', '\$22.99', '4K Ultra HD', '4 Devices', '6 Downloads', true, isPremium: true),
          ],
        ),
      ),
    );
  }

  Widget _planCard(BuildContext context, String name, String price, String quality, String devices, String downloads, bool adFree, {bool isPopular = false, bool isPremium = false}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isPopular ? AppColors.primary.withValues(alpha: 0.1) : AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPopular ? AppColors.primary : AppColors.outlineVariant,
          width: isPopular ? 2 : 0.5,
        ),
      ),
      child: Column(
        children: [
          if (isPopular)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('POPULAR', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          Text(name, style: AppTypography.headlineMd),
          const SizedBox(height: 8),
          Text(price, style: AppTypography.displayMd.copyWith(fontSize: 36)),
          Text('/month', style: TextStyle(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 20),
          _feature(Icons.visibility, quality),
          _feature(Icons.devices, devices),
          _feature(Icons.download, downloads),
          _feature(Icons.ad_units, adFree ? 'Ad-Free' : 'Ads Supported'),
          const SizedBox(height: 24),
          AppButton(
            label: isPremium ? 'Subscribe' : 'Get Started',
            onPressed: () {},
            color: isPremium ? AppColors.primary : null,
          ),
        ],
      ),
    );
  }

  Widget _feature(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.secondary),
          const SizedBox(width: 12),
          Text(text, style: AppTypography.bodyMd),
        ],
      ),
    );
  }
}
