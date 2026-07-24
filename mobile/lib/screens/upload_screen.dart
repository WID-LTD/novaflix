import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../theme/app_colors.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';
import 'package:dio/dio.dart';

class UploadScreen extends ConsumerStatefulWidget {
  const UploadScreen({super.key});

  @override
  ConsumerState<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends ConsumerState<UploadScreen> {
  final _titleCtl = TextEditingController();
  final _descCtl = TextEditingController();
  String _genre = 'Action';
  bool _uploading = false;
  File? _videoFile;

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    final video = await picker.pickVideo(source: ImageSource.gallery);
    if (video != null) setState(() => _videoFile = File(video.path));
  }

  Future<void> _upload() async {
    if (_titleCtl.text.isEmpty || _videoFile == null) return;
    setState(() => _uploading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final form = FormData.fromMap({
        'title': _titleCtl.text,
        'description': _descCtl.text,
        'genre': _genre,
        'video': await MultipartFile.fromFile(_videoFile!.path, filename: 'upload.mp4'),
      });
      await api.uploadFilm(form);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload successful!')));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  void dispose() {
    _titleCtl.dispose();
    _descCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Upload Content')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            GestureDetector(
              onTap: _pickVideo,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.outlineVariant),
                ),
                child: _videoFile != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(_videoFile!, fit: BoxFit.cover, width: double.infinity))
                  : Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.cloud_upload, size: 48, color: AppColors.onSurfaceVariant),
                          const SizedBox(height: 8),
                          Text('Tap to select video', style: TextStyle(color: AppColors.onSurfaceVariant)),
                        ],
                      ),
                    ),
              ),
            ),
            const SizedBox(height: 24),
            AppInput(controller: _titleCtl, label: 'Title', hint: 'Enter video title'),
            const SizedBox(height: 16),
            AppInput(controller: _descCtl, label: 'Description', hint: 'Enter description'),
            const SizedBox(height: 16),
            AppDropdown(
              label: 'Genre',
              value: _genre,
              items: const ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance'],
              onChanged: (v) => setState(() => _genre = v ?? 'Action'),
            ),
            const SizedBox(height: 24),
            AppButton(label: 'Upload', onPressed: _upload, loading: _uploading),
          ],
        ),
      ),
    );
  }
}
