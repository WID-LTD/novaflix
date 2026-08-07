import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _myCoursesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMyCourses();
  final data = res.data['courses'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class CreatorCoursesScreen extends ConsumerStatefulWidget {
  const CreatorCoursesScreen({super.key});
  @override
  ConsumerState<CreatorCoursesScreen> createState() => _CreatorCoursesScreenState();
}

class _CreatorCoursesScreenState extends ConsumerState<CreatorCoursesScreen> {
  final _titleCtl = TextEditingController();
  final _descCtl = TextEditingController();
  final _priceCtl = TextEditingController();
  final _imageCtl = TextEditingController();
  final _durationCtl = TextEditingController();
  final _lessonsCtl = TextEditingController();
  String _category = 'Filmmaking';
  bool _showForm = false;
  int? _editId;

  void _resetForm() {
    _titleCtl.clear(); _descCtl.clear(); _priceCtl.clear(); _imageCtl.clear();
    _durationCtl.clear(); _lessonsCtl.clear();
    _category = 'Filmmaking'; _editId = null; _showForm = false;
  }

  Future<void> _save() async {
    final api = ref.read(apiServiceProvider);
    final data = {
      'title': _titleCtl.text, 'description': _descCtl.text,
      'price': double.tryParse(_priceCtl.text) ?? 0,
      'image_url': _imageCtl.text, 'category': _category,
      'duration': int.tryParse(_durationCtl.text) ?? 0,
      'lessons_count': int.tryParse(_lessonsCtl.text) ?? 0,
    };
    if (_editId != null) {
      await api.updateCourse(_editId!, FormData.fromMap(data));
    } else {
      await api.createCourse(FormData.fromMap(data));
    }
    _resetForm();
    ref.invalidate(_myCoursesProvider);
  }

  @override
  void dispose() {
    _titleCtl.dispose(); _descCtl.dispose(); _priceCtl.dispose();
    _imageCtl.dispose(); _durationCtl.dispose(); _lessonsCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final courses = ref.watch(_myCoursesProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Courses'), actions: [
        IconButton(icon: Icon(_showForm ? Icons.close : Icons.add), onPressed: () => setState(() => _showForm = !_showForm)),
      ]),
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
                child: Column(children: [
                  AppInput(controller: _titleCtl, label: 'Title'),
                  const SizedBox(height: 8),
                  AppInput(controller: _priceCtl, label: 'Price', hint: '0.00', keyboardType: TextInputType.number),
                  const SizedBox(height: 8),
                  AppInput(controller: _imageCtl, label: 'Image URL'),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: AppInput(controller: _durationCtl, label: 'Duration (min)', keyboardType: TextInputType.number)),
                    const SizedBox(width: 8),
                    Expanded(child: AppInput(controller: _lessonsCtl, label: 'Lessons', keyboardType: TextInputType.number)),
                  ]),
                  const SizedBox(height: 8),
                  AppInput(controller: _descCtl, label: 'Description'),
                  const SizedBox(height: 16),
                  AppButton(label: _editId != null ? 'Update' : 'Create', onPressed: _save),
                ]),
              ),
              const SizedBox(height: 16),
            ],
            courses.when(
              data: (items) => Column(
                children: items.map((c) => Opacity(
                  opacity: (c['active'] as bool?) == false ? 0.5 : 1,
                  child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(child: Text(c['title']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600))),
                        IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: () {}),
                      ]),
                      if (c['price'] != null) Text('\$${(c['price'] as num).toStringAsFixed(2)}', style: TextStyle(color: AppColors.primary)),
                      Row(children: [
                        Text('${c['lessons_count'] ?? 0} lessons', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                        Text('  |  ${c['duration'] ?? 0}min', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                        if (c['students_count'] != null) Text('  |  ${c['students_count']} students', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                      ]),
                    ],
                  ),
                ))).toList(),
              ),
              loading: () => const LoadingSpinner(logo: true),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ],
        ),
      ),
    );
  }
}
