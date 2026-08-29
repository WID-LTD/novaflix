import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/responsive.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _coursesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCourses();
  final data = res.data['courses'] as List? ?? res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

final _enrollmentsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMyEnrollments();
  final data = res.data['enrollments'] as List? ?? res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class LearnScreen extends ConsumerStatefulWidget {
  const LearnScreen({super.key});

  @override
  ConsumerState<LearnScreen> createState() => _LearnScreenState();
}

class _LearnScreenState extends ConsumerState<LearnScreen> {
  String _category = 'All';
  bool _myCoursesOpen = false;
  String? _enrollingId;

  bool _isEnrolled(
    List<Map<String, dynamic>> enrollments,
    Map<String, dynamic> course,
  ) {
    final id = course['id'].toString();
    return enrollments.any((e) => e['course_id']?.toString() == id);
  }

  Future<void> _enroll(Map<String, dynamic> course) async {
    final user = ref.read(authProvider).user;
    if (user == null) {
      context.push('/login?redirect=/learn');
      return;
    }
    final id = course['id'];
    if (id is! int && id is! String) return;
    final courseId = int.tryParse(id.toString()) ?? -1;
    if (courseId < 0) return;
    setState(() => _enrollingId = id.toString());
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.enrollCourse(courseId);
      final body = res.data is Map ? res.data as Map : <String, dynamic>{};
      if (body['free'] == true) {
        setState(() => _enrollingId = null);
        _toast('Enrolled! Start learning now.');
        ref.invalidate(_enrollmentsProvider);
      } else if (body['authorization_url'] != null) {
        setState(() => _enrollingId = null);
        if (context.mounted) {
          context.push(
            '/payment-success?reference=${body['reference'] ?? ''}&source=course',
          );
        }
      } else {
        setState(() => _enrollingId = null);
        _toast(body['error']?.toString() ?? 'Enrollment failed');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _enrollingId = null);
        _toast('Enrollment failed. Try again.');
      }
    }
  }

  void _toast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.surfaceContainerHigh,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final courses = ref.watch(_coursesProvider);
    final user = ref.watch(authProvider).user;
    final enrollments = user != null
        ? ref.watch(_enrollmentsProvider).valueOrNull ?? []
        : <Map<String, dynamic>>[];
    final width = MediaQuery.sizeOf(context).width;
    final hPadding = responsivePadding(width);
    final categories = <String>[
      'All',
      ...courses.value?.map((c) => c['category']?.toString() ?? '').where((c) => c.isNotEmpty).toSet() ?? [],
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(hPadding, 24, hPadding, 48),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1152),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.school, size: 28, color: AppColors.primaryContainer),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text('E-Learning', style: AppTypography.headlineLg),
                        ),
                        if (user != null)
                          InkWell(
                            onTap: () => setState(() => _myCoursesOpen = true),
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.bookmark,
                                    size: 16,
                                    color: AppColors.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'My Courses (${enrollments.length})',
                                    style: AppTypography.labelSm.copyWith(
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Master the art of filmmaking',
                      style: AppTypography.bodySm.copyWith(
                        color: AppColors.onSurfaceVariant.withValues(alpha: 0.6),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (categories.length > 1) _categoryChips(categories),
                    const SizedBox(height: 24),
                    courses.when(
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: Center(child: LoadingSpinner()),
                      ),
                      error: (e, _) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: Text(
                            'Error: $e',
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                      ),
                      data: (items) {
                        final filtered = _category == 'All'
                            ? items
                            : items
                                  .where((c) => c['category']?.toString() == _category)
                                  .toList();
                        if (filtered.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 60),
                            child: Center(
                              child: Column(
                                children: [
                                  Icon(Icons.school, size: 48, color: AppColors.onSurfaceVariant),
                                  SizedBox(height: 12),
                                  Text(
                                    'No courses available yet',
                                    style: TextStyle(color: AppColors.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }
                        return _courseGrid(filtered, enrollments);
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_myCoursesOpen) _myCoursesDrawer(enrollments),
        ],
      ),
    );
  }

  Widget _categoryChips(List<String> categories) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final c in categories)
          GestureDetector(
            onTap: () => setState(() => _category = c),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: _category == c
                    ? AppColors.primaryContainer
                    : AppColors.surfaceVariant.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
                border: _category == c
                    ? null
                    : Border.all(color: AppColors.outline.withValues(alpha: 0.2)),
              ),
              child: Text(
                c,
                style: AppTypography.bodySm.copyWith(
                  color: _category == c
                      ? AppColors.onPrimaryContainer
                      : AppColors.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _courseGrid(
    List<Map<String, dynamic>> items,
    List<Map<String, dynamic>> enrollments,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = gridColumnsForWidth(constraints.maxWidth).clamp(1, 3);
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: cols,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: gridAspectRatio(constraints.maxWidth, cols, spacing: 16),
          ),
          itemCount: items.length,
          itemBuilder: (_, i) => _CourseCard(
            course: items[i],
            enrolled: _isEnrolled(enrollments, items[i]),
            enrolling: _enrollingId == items[i]['id'].toString(),
            onEnroll: () => _enroll(items[i]),
          ),
        );
      },
    );
  }

  Widget _myCoursesDrawer(List<Map<String, dynamic>> enrollments) {
    final w = MediaQuery.sizeOf(context).width;
    return Positioned(
      right: 0,
      top: 0,
      bottom: 0,
      child: Container(
        width: w >= 468 ? 420 : w - 48,
        color: AppColors.surfaceContainerLowest,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Text(
                    'My Courses (${enrollments.length})',
                    style: AppTypography.labelLg.copyWith(
                      color: AppColors.onSurface,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => setState(() => _myCoursesOpen = false),
                    icon: const Icon(Icons.close, color: AppColors.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            Divider(color: AppColors.white.withValues(alpha: 0.05)),
            Expanded(
              child: enrollments.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 60),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.bookmark, size: 36, color: AppColors.onSurfaceVariant),
                            SizedBox(height: 12),
                            Text(
                              'No enrollments yet',
                              style: TextStyle(color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: enrollments.length,
                      itemBuilder: (_, i) {
                        final e = enrollments[i];
                        final progress = (e['progress'] as num? ?? 0).toDouble();
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                e['course_title']?.toString() ?? '',
                                style: AppTypography.labelMd.copyWith(
                                  color: AppColors.onSurface,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                e['creator_name']?.toString() ?? '',
                                style: AppTypography.labelSm.copyWith(
                                  color: AppColors.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(999),
                                      child: LinearProgressIndicator(
                                        value: progress / 100,
                                        minHeight: 8,
                                        backgroundColor: AppColors.surface,
                                        valueColor: const AlwaysStoppedAnimation(
                                          AppColors.primaryContainer,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${progress.toStringAsFixed(0)}%',
                                    style: AppTypography.labelXs.copyWith(
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CourseCard extends StatelessWidget {
  final Map<String, dynamic> course;
  final bool enrolled;
  final bool enrolling;
  final VoidCallback onEnroll;

  const _CourseCard({
    required this.course,
    required this.enrolled,
    required this.enrolling,
    required this.onEnroll,
  });

  @override
  Widget build(BuildContext context) {
    final title = course['title']?.toString() ?? '';
    final image = course['image_url']?.toString();
    final creator = course['creator_name']?.toString() ?? '';
    final price = (course['price'] as num? ?? 0);
    final lessons = course['lessons_count']?.toString() ?? '0';
    final duration = course['duration']?.toString() ?? '';
    final rating = (course['rating'] as num? ?? 0).toDouble();
    final students = course['students_count']?.toString() ?? '0';
    final isPaid = price > 0;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.surfaceContainer,
                    AppColors.surfaceContainerHigh,
                  ],
                ),
              ),
              child: image != null && image.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: image,
                      fit: BoxFit.cover,
                      errorWidget: (_, _, _) =>
                          const Icon(Icons.play_circle, size: 56, color: AppColors.onSurfaceVariant),
                    )
                  : const Icon(Icons.play_circle, size: 56, color: AppColors.onSurfaceVariant),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.labelLg.copyWith(color: AppColors.onSurface),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  creator,
                  style: AppTypography.labelSm.copyWith(color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _meta(Icons.menu_book, '$lessons lessons'),
                    const SizedBox(width: 10),
                    _meta(Icons.schedule, duration),
                    const SizedBox(width: 10),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: Color(0xFFFFC107)),
                        const SizedBox(width: 2),
                        Text(
                          rating.toStringAsFixed(1),
                          style: AppTypography.labelXs.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  course['description']?.toString() ?? '',
                  style: AppTypography.bodySm.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '$students students',
                        style: AppTypography.labelSm.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ),
                    if (enrolled)
                      Row(
                        children: [
                          const Icon(Icons.check_circle, size: 14, color: AppColors.secondary),
                          const SizedBox(width: 4),
                          Text(
                            'Enrolled',
                            style: AppTypography.labelSm.copyWith(
                              color: AppColors.secondary,
                            ),
                          ),
                        ],
                      )
                    else
                      FilledButton(
                        onPressed: enrolling ? null : onEnroll,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryContainer,
                          foregroundColor: AppColors.onPrimaryContainer,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: enrolling
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                isPaid ? 'Enroll Now' : 'Free',
                                style: AppTypography.labelSm.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _meta(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.onSurfaceVariant),
        const SizedBox(width: 3),
        Text(
          text,
          style: AppTypography.labelXs.copyWith(color: AppColors.onSurfaceVariant),
        ),
      ],
    );
  }
}