import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';

class UploadScreen extends ConsumerStatefulWidget {
  const UploadScreen({super.key});

  @override
  ConsumerState<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends ConsumerState<UploadScreen> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String? _selectedGenre;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Upload Film')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppTheme.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.darkGray, width: 2, strokeAlign: BorderSide.strokeAlignInside),
              ),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cloud_upload_outlined, size: 48, color: AppTheme.gray),
                    SizedBox(height: 8),
                    Text('Tap to upload video', style: TextStyle(color: AppTheme.gray)),
                    Text('MP4, WebM, or MOV', style: TextStyle(color: AppTheme.darkGray, fontSize: 12)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 16),
            TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 4),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(8)),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedGenre,
                  isExpanded: true,
                  hint: const Text('Select Genre', style: TextStyle(color: AppTheme.gray)),
                  dropdownColor: AppTheme.card,
                  style: const TextStyle(color: AppTheme.white),
                  items: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                  onChanged: (v) => setState(() => _selectedGenre = v),
                ),
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(width: double.infinity, height: 48, child: ElevatedButton(
              onPressed: () {},
              child: const Text('Upload Film'),
            )),
          ],
        ),
      ),
    );
  }
}
