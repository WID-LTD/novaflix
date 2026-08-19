import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _myCampaignsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCampaigns();
  final data = res.data['campaigns'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class CreatorCampaignsScreen extends ConsumerStatefulWidget {
  const CreatorCampaignsScreen({super.key});
  @override
  ConsumerState<CreatorCampaignsScreen> createState() => _CreatorCampaignsScreenState();
}

class _CreatorCampaignsScreenState extends ConsumerState<CreatorCampaignsScreen> {
  final _advertiserCtl = TextEditingController();
  final _creativeCtl = TextEditingController();
  final _budgetCtl = TextEditingController();
  final _impressionsCtl = TextEditingController();
  String _promotionType = 'grid';
  String _targetGenre = 'Action';
  bool _showForm = false;

  Future<void> _save() async {
    final api = ref.read(apiServiceProvider);
    await api.createCampaign({
      'advertiser_name': _advertiserCtl.text,
      'creative_url': _creativeCtl.text,
      'promotion_type': _promotionType,
      'target_genre': _targetGenre,
      'max_impressions': int.tryParse(_impressionsCtl.text) ?? 0,
      'budget': double.tryParse(_budgetCtl.text) ?? 0,
    });
    _advertiserCtl.clear(); _creativeCtl.clear(); _budgetCtl.clear(); _impressionsCtl.clear();
    _showForm = false;
    ref.invalidate(_myCampaignsProvider);
  }

  @override
  void dispose() {
    _advertiserCtl.dispose(); _creativeCtl.dispose(); _budgetCtl.dispose(); _impressionsCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final campaigns = ref.watch(_myCampaignsProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Campaigns'), actions: [
        IconButton(icon: Icon(_showForm ? Icons.close : Icons.add), onPressed: () => setState(() => _showForm = !_showForm)),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (_showForm) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(12)),
                child: Column(children: [
                  AppInput(controller: _advertiserCtl, label: 'Advertiser Name'),
                  const SizedBox(height: 8),
                  AppInput(controller: _creativeCtl, label: 'Creative URL'),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: AppInput(controller: _impressionsCtl, label: 'Max Impressions', keyboardType: TextInputType.number)),
                    const SizedBox(width: 8),
                    Expanded(child: AppInput(controller: _budgetCtl, label: 'Budget', keyboardType: TextInputType.number)),
                  ]),
                  const SizedBox(height: 8),
                  AppDropdown(label: 'Type', value: _promotionType, items: const ['grid', 'hooks', 'banner'], onChanged: (v) => setState(() => _promotionType = v ?? 'grid')),
                  const SizedBox(height: 16),
                  AppButton(label: 'Create Campaign', onPressed: _save),
                ]),
              ),
              const SizedBox(height: 16),
            ],
            campaigns.when(
              data: (items) => Column(
                children: items.map((c) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(12)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(c['advertiser_name']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: (c['approved'] as bool?) == true ? Colors.green.withValues(alpha: 0.2) : Colors.orange.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text((c['approved'] as bool?) == true ? 'Approved' : 'Pending', style: TextStyle(fontSize: 11, color: (c['approved'] as bool?) == true ? Colors.green : Colors.orange)),
                      ),
                    ]),
                    const SizedBox(height: 4),
                    Text('${c['promotion_type'] ?? ''}  |  ${c['target_genre'] ?? ''}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                    Text('Impressions: ${c['current_impressions'] ?? 0}/${c['max_impressions'] ?? 0}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                    Text('Budget: \$${(c['budget'] as num?)?.toStringAsFixed(2) ?? '0'}  |  Spent: \$${(c['spent'] as num?)?.toStringAsFixed(2) ?? '0'}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                  ]),
                )).toList(),
              ),
              loading: () => const LoadingSpinner(),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ],
        ),
      ),
    );
  }
}
