import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _myProductsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMyProducts();
  final data = res.data['products'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class CreatorProductsScreen extends ConsumerStatefulWidget {
  const CreatorProductsScreen({super.key});
  @override
  ConsumerState<CreatorProductsScreen> createState() =>
      _CreatorProductsScreenState();
}

class _CreatorProductsScreenState extends ConsumerState<CreatorProductsScreen> {
  final _titleCtl = TextEditingController();
  final _descCtl = TextEditingController();
  final _priceCtl = TextEditingController();
  final _imageCtl = TextEditingController();
  String _category = 'T-Shirts';
  bool _showForm = false;
  int? _editId;

  void _resetForm() {
    _titleCtl.clear();
    _descCtl.clear();
    _priceCtl.clear();
    _imageCtl.clear();
    _editId = null;
    _showForm = false;
  }

  Future<void> _save() async {
    final api = ref.read(apiServiceProvider);
    final data = FormData.fromMap({
      'title': _titleCtl.text,
      'description': _descCtl.text,
      'price': double.tryParse(_priceCtl.text) ?? 0,
      'image_url': _imageCtl.text,
      'category': _category,
    });
    if (_editId != null) {
      await api.updateProduct(_editId!, data);
    } else {
      await api.createProduct(data);
    }
    _resetForm();
    ref.invalidate(_myProductsProvider);
  }

  @override
  void dispose() {
    _titleCtl.dispose();
    _descCtl.dispose();
    _priceCtl.dispose();
    _imageCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final products = ref.watch(_myProductsProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(
            icon: Icon(_showForm ? Icons.close : Icons.add),
            onPressed: () => setState(() => _showForm = !_showForm),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (_showForm) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    AppInput(controller: _titleCtl, label: 'Product Name'),
                    const SizedBox(height: 8),
                    AppInput(
                      controller: _priceCtl,
                      label: 'Price',
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 8),
                    AppInput(controller: _imageCtl, label: 'Image URL'),
                    const SizedBox(height: 8),
                    AppDropdown(
                      label: 'Category',
                      value: _category,
                      items: const [
                        'T-Shirts',
                        'Posters',
                        'Mugs',
                        'Accessories',
                        'Digital',
                      ],
                      onChanged: (v) =>
                          setState(() => _category = v ?? 'T-Shirts'),
                    ),
                    const SizedBox(height: 8),
                    AppInput(controller: _descCtl, label: 'Description'),
                    const SizedBox(height: 16),
                    AppButton(
                      label: _editId != null ? 'Update' : 'Create',
                      onPressed: _save,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            products.when(
              data: (items) => GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: gridColumnsFor(
                    MediaQuery.sizeOf(context).width,
                  ),
                  childAspectRatio: 0.75,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: items.length,
                itemBuilder: (_, i) {
                  final p = items[i];
                  return Opacity(
                    opacity: (p['active'] as bool?) == false ? 0.5 : 1,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: AppColors.surfaceContainerHighest,
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(12),
                                ),
                                image: p['image_url'] != null
                                    ? DecorationImage(
                                        image: NetworkImage(
                                          p['image_url'].toString(),
                                        ),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: p['image_url'] == null
                                  ? const Icon(
                                      Icons.shopping_bag,
                                      color: AppColors.onSurfaceVariant,
                                      size: 36,
                                    )
                                  : null,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p['title']?.toString() ?? '',
                                  style: AppTypography.bodySm.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  '\$${(p['price'] as num?)?.toStringAsFixed(2) ?? '0.00'}',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ); // closes Container + Opacity
                },
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
