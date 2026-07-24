import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _tiersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMyTiers();
  return (res.data['tiers'] as List?)?.cast<Map<String, dynamic>>() ?? [];
});

final _subscribersProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMySubscribers();
  return {
    'subscribers': (res.data['subscribers'] as List?)?.cast<Map<String, dynamic>>() ?? [],
    'stats': res.data['stats'] as Map<String, dynamic>? ?? {},
  };
});

class CreatorMembershipManagerScreen extends ConsumerStatefulWidget {
  const CreatorMembershipManagerScreen({super.key});
  @override
  ConsumerState<CreatorMembershipManagerScreen> createState() => _CreatorMembershipManagerScreenState();
}

class _CreatorMembershipManagerScreenState extends ConsumerState<CreatorMembershipManagerScreen> {
  final _nameCtl = TextEditingController();
  final _descCtl = TextEditingController();
  final _priceCtl = TextEditingController();
  final _benefitsCtl = TextEditingController();
  bool _showForm = false;
  int? _editId;

  void _resetForm() {
    _nameCtl.clear(); _descCtl.clear(); _priceCtl.clear(); _benefitsCtl.clear();
    _editId = null; _showForm = false;
  }

  Future<void> _save() async {
    final api = ref.read(apiServiceProvider);
    final data = {
      'name': _nameCtl.text, 'description': _descCtl.text,
      'price': double.tryParse(_priceCtl.text) ?? 0,
      'benefits': _benefitsCtl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
    };
    if (_editId != null) {
      await api.updateTier(_editId!, data);
    } else {
      await api.createTier(data);
    }
    _resetForm();
    ref.invalidate(_tiersProvider);
  }

  @override
  void dispose() {
    _nameCtl.dispose(); _descCtl.dispose(); _priceCtl.dispose(); _benefitsCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tiers = ref.watch(_tiersProvider);
    final subs = ref.watch(_subscribersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Memberships'), actions: [
        IconButton(icon: Icon(_showForm ? Icons.close : Icons.add), onPressed: () => setState(() => _showForm = !_showForm)),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            subs.when(data: (s) {
              final stats = s['stats'] as Map<String, dynamic>? ?? {};
              return Row(children: [
                _statBox('${stats['totalSubscribers'] ?? 0}', 'Subscribers'),
                const SizedBox(width: 8),
                _statBox('\$${(stats['monthlyRevenue'] as num?)?.toStringAsFixed(2) ?? '0'}', 'Monthly Rev.'),
              ]);
            }, loading: () => const SizedBox(), error: (_, __) => const SizedBox()),
            const SizedBox(height: 16),
            if (_showForm) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(12)),
                child: Column(children: [
                  AppInput(controller: _nameCtl, label: 'Tier Name'),
                  const SizedBox(height: 8),
                  AppInput(controller: _priceCtl, label: 'Price / month', keyboardType: TextInputType.number),
                  const SizedBox(height: 8),
                  AppInput(controller: _benefitsCtl, label: 'Benefits (comma-separated)'),
                  const SizedBox(height: 8),
                  AppInput(controller: _descCtl, label: 'Description'),
                  const SizedBox(height: 16),
                  AppButton(label: _editId != null ? 'Update Tier' : 'Create Tier', onPressed: _save),
                ]),
              ),
              const SizedBox(height: 16),
            ],
            tiers.when(
              data: (items) => Column(
                children: items.map((t) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t['name']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                      Text('\$${(t['price'] as num?)?.toStringAsFixed(2) ?? '0'}/mo', style: const TextStyle(color: AppColors.primary)),
                      if (t['benefits'] != null) ...[
                        const SizedBox(height: 8),
                        ...((t['benefits'] as List?)?.map((b) => Row(children: [
                          const Icon(Icons.check, size: 14, color: Colors.green),
                          const SizedBox(width: 4),
                          Text(b.toString(), style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                        ])).toList() ?? []),
                      ],
                    ],
                  ),
                )).toList(),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statBox(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(12)),
        child: Column(children: [
          Text(value, style: AppTypography.headlineSm),
          Text(label, style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
        ]),
      ),
    );
  }
}
