import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _forumCategoriesProvider = FutureProvider<List<String>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getForumCategories();
  final data = res.data['categories'] as List? ?? [];
  return data.cast<String>();
});

final _forumTopicsProvider =
    FutureProvider.family<
      List<Map<String, dynamic>>,
      ({String? category, String sort})
    >((ref, args) async {
      final api = ref.read(apiServiceProvider);
      final res = await api.getForumTopics(
        category: args.category,
        sort: args.sort,
      );
      final data = res.data['topics'] as List? ?? [];
      return data.cast<Map<String, dynamic>>();
    });

final _forumTopicProvider = FutureProvider.family<Map<String, dynamic>, int>((
  ref,
  id,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getForumTopic(id);
  return res.data['topic'] as Map<String, dynamic>? ?? {};
});

class ForumScreen extends ConsumerStatefulWidget {
  final int? topicId;

  const ForumScreen({super.key, this.topicId});

  @override
  ConsumerState<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends ConsumerState<ForumScreen> {
  String? _selectedCategory;
  String _sort = 'hot';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Hot Takes')),
      body: widget.topicId != null
          ? _ThreadView(topicId: widget.topicId!)
          : _buildTopicList(),
      floatingActionButton: widget.topicId == null
          ? FloatingActionButton(
              onPressed: _openCreateTopicSheet,
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildTopicList() {
    final categories = ref.watch(_forumCategoriesProvider);
    final topics = ref.watch(
      _forumTopicsProvider((category: _selectedCategory, sort: _sort)),
    );
    return Column(
      children: [
        categories.when(
          data: (cats) => SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: cats.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                if (i == 0) {
                  return _CategoryChip(
                    label: 'All',
                    selected: _selectedCategory == null,
                    onTap: () => setState(() => _selectedCategory = null),
                  );
                }
                final cat = cats[i - 1];
                return _CategoryChip(
                  label: cat,
                  selected: _selectedCategory == cat,
                  onTap: () => setState(() => _selectedCategory = cat),
                );
              },
            ),
          ),
          loading: () => const SizedBox(
            height: 44,
            child: Center(child: LoadingSpinner(size: 20)),
          ),
          error: (e, _) => SizedBox(
            height: 44,
            child: Center(
              child: Text(
                'Categories unavailable',
                style: TextStyle(color: AppColors.error),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Align(
            alignment: Alignment.centerLeft,
            child: AppTabs(
              tabs: const ['Hot', 'New'],
              activeIndex: _sort == 'hot' ? 0 : 1,
              onChanged: (i) => setState(() => _sort = i == 0 ? 'hot' : 'new'),
            ),
          ),
        ),
        Expanded(
          child: topics.when(
            data: (items) => items.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.whatshot,
                          size: 64,
                          color: AppColors.onSurfaceVariant,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No hot takes yet. Start one!',
                          style: AppTypography.bodyMd.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                    itemCount: items.length,
                    itemBuilder: (_, i) => _TopicCard(topic: items[i]),
                  ),
            loading: () => const LoadingSpinner(logo: true),
            error: (e, _) => Center(
              child: Text(
                'Error: $e',
                style: const TextStyle(color: AppColors.error),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _openCreateTopicSheet() async {
    final titleController = TextEditingController();
    final bodyController = TextEditingController();
    String? selectedCategory;
    final categories = ref.read(_forumCategoriesProvider).value ?? <String>[];
    final submitted = await AppModal.show<bool>(
      context,
      title: 'New Hot Take',
      content: StatefulBuilder(
        builder: (context, setModalState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppInput(
                controller: titleController,
                label: 'Title',
                hint: 'What\'s your take?',
              ),
              const SizedBox(height: 12),
              AppInput(
                controller: bodyController,
                label: 'Details',
                hint: 'Add some context…',
                keyboardType: TextInputType.multiline,
              ),
              const SizedBox(height: 12),
              AppDropdown(
                label: 'Category',
                items: categories.isEmpty ? const ['General'] : categories,
                value: selectedCategory,
                onChanged: (v) => setModalState(() => selectedCategory = v),
              ),
            ],
          );
        },
      ),
      actions: [
        AppButton(
          label: 'Cancel',
          text: true,
          onPressed: () => Navigator.of(context).pop(false),
        ),
        const SizedBox(width: 8),
        AppButton(
          label: 'Post',
          fullWidth: false,
          onPressed: () async {
            final title = titleController.text.trim();
            final body = bodyController.text.trim();
            if (title.isEmpty) return;
            Navigator.of(context).pop(true);
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Posting…')));
            try {
              final api = ref.read(apiServiceProvider);
              await api.createForumTopic({
                'title': title,
                'body': body,
                'category': selectedCategory,
              });
              if (mounted) {
                ref.invalidate(
                  _forumTopicsProvider((
                    category: _selectedCategory,
                    sort: _sort,
                  )),
                );
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(const SnackBar(content: Text('Topic posted!')));
              }
            } catch (e) {
              if (mounted)
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text('Failed to post: $e')));
            }
          },
        ),
      ],
    );
    if (submitted == true && mounted) {
      ref.invalidate(
        _forumTopicsProvider((category: _selectedCategory, sort: _sort)),
      );
    }
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.2)
              : AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.outlineVariant,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.labelSm.copyWith(
            color: selected ? AppColors.primary : AppColors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

class _TopicCard extends ConsumerWidget {
  final Map<String, dynamic> topic;

  const _TopicCard({required this.topic});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = topic['id'] as int? ?? 0;
    final votes = topic['votes'] as int? ?? 0;
    final replyCount = topic['reply_count'] as int? ?? 0;
    return GestureDetector(
      onTap: () => context.push('/forum/$id'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _VoteColumn(
              votes: votes,
              onUp: () => _vote(ref, context, id, 1),
              onDown: () => _vote(ref, context, id, -1),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    topic['title']?.toString() ?? '',
                    style: AppTypography.bodyMd.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (topic['body'] != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      topic['body'].toString(),
                      style: AppTypography.bodySm.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (topic['category'] != null) ...[
                        AppBadge(
                          label: topic['category'].toString().toUpperCase(),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 14,
                        color: AppColors.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$replyCount',
                        style: const TextStyle(
                          color: AppColors.onSurfaceVariant,
                          fontSize: 12,
                        ),
                      ),
                      if (topic['author_name'] != null) ...[
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            topic['author_name'].toString(),
                            style: const TextStyle(
                              color: AppColors.onSurfaceVariant,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _vote(
    WidgetRef ref,
    BuildContext context,
    int id,
    int value,
  ) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.voteForumTopic(id, value);
      ref.invalidate(_forumTopicsProvider);
    } catch (e) {
      if (context.mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Vote failed: $e')));
    }
  }
}

class _VoteColumn extends StatelessWidget {
  final int votes;
  final VoidCallback onUp;
  final VoidCallback onDown;

  const _VoteColumn({
    required this.votes,
    required this.onUp,
    required this.onDown,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        IconButton(
          onPressed: onUp,
          visualDensity: VisualDensity.compact,
          icon: const Icon(Icons.arrow_drop_up, color: AppColors.primaryLight),
        ),
        Text(
          '$votes',
          style: AppTypography.labelLg.copyWith(color: AppColors.onSurface),
        ),
        IconButton(
          onPressed: onDown,
          visualDensity: VisualDensity.compact,
          icon: const Icon(
            Icons.arrow_drop_down,
            color: AppColors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _ThreadView extends ConsumerWidget {
  final int topicId;

  const _ThreadView({required this.topicId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topic = ref.watch(_forumTopicProvider(topicId));
    return topic.when(
      data: (t) {
        if (t.isEmpty) {
          return Center(
            child: Text(
              'Topic not found',
              style: const TextStyle(color: AppColors.error),
            ),
          );
        }
        final replies = t['replies'] as List? ?? [];
        return Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                children: [
                  _ThreadTopicHeader(topic: t, topicId: topicId),
                  if (replies.isEmpty)
                    const Padding(
                      padding: EdgeInsets.only(top: 24),
                      child: Center(
                        child: Text(
                          'No replies yet. Drop your take!',
                          style: TextStyle(color: AppColors.onSurfaceVariant),
                        ),
                      ),
                    )
                  else
                    ...replies
                        .map(
                          (r) => _ReplyTile(
                            reply: r.cast<Map<String, dynamic>>(),
                            depth: 0,
                            topicId: topicId,
                          ),
                        )
                        .toList(),
                ],
              ),
            ),
          ],
        );
      },
      loading: () => const LoadingSpinner(logo: true),
      error: (e, _) => Center(
        child: Text(
          'Error: $e',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
    );
  }
}

class _ThreadTopicHeader extends ConsumerWidget {
  final Map<String, dynamic> topic;
  final int topicId;

  const _ThreadTopicHeader({required this.topic, required this.topicId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final votes = topic['votes'] as int? ?? 0;
    final replies = topic['replies'] as List? ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _VoteColumn(
            votes: votes,
            onUp: () async {
              try {
                await ref.read(apiServiceProvider).voteForumTopic(topicId, 1);
                ref.invalidate(_forumTopicProvider(topicId));
              } catch (e) {
                if (context.mounted)
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text('Vote failed: $e')));
              }
            },
            onDown: () async {
              try {
                await ref.read(apiServiceProvider).voteForumTopic(topicId, -1);
                ref.invalidate(_forumTopicProvider(topicId));
              } catch (e) {
                if (context.mounted)
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text('Vote failed: $e')));
              }
            },
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  topic['title']?.toString() ?? '',
                  style: AppTypography.headlineSm,
                ),
                if (topic['body'] != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    topic['body'].toString(),
                    style: AppTypography.bodyMd.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (topic['category'] != null) ...[
                      AppBadge(
                        label: topic['category'].toString().toUpperCase(),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Icon(
                      Icons.chat_bubble_outline,
                      size: 14,
                      color: AppColors.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${replies.length} replies',
                      style: const TextStyle(
                        color: AppColors.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                    if (topic['author_name'] != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        topic['author_name'].toString(),
                        style: const TextStyle(
                          color: AppColors.onSurfaceVariant,
                          fontSize: 12,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                _ReplyComposer(topicId: topicId),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReplyComposer extends ConsumerStatefulWidget {
  final int topicId;

  const _ReplyComposer({required this.topicId});

  @override
  ConsumerState<_ReplyComposer> createState() => _ReplyComposerState();
}

class _ReplyComposerState extends ConsumerState<_ReplyComposer> {
  final _controller = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.addForumReply(widget.topicId, text);
      _controller.clear();
      ref.invalidate(_forumTopicProvider(widget.topicId));
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Reply failed: $e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: AppInput(controller: _controller, hint: 'Reply…'),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: _sending ? null : _submit,
          style: IconButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.onPrimary,
          ),
          icon: _sending
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.send),
        ),
      ],
    );
  }
}

class _ReplyTile extends ConsumerWidget {
  final Map<String, dynamic> reply;
  final int depth;
  final int topicId;

  const _ReplyTile({
    required this.reply,
    required this.depth,
    required this.topicId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final votes = reply['votes'] as int? ?? 0;
    final children = reply['replies'] as List? ?? [];
    final isNested = depth < 3;
    final card = Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _VoteColumn(
                votes: votes,
                onUp: () async {
                  try {
                    await ref
                        .read(apiServiceProvider)
                        .voteForumTopic(topicId, 1);
                    ref.invalidate(_forumTopicProvider(topicId));
                  } catch (e) {
                    if (context.mounted)
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Vote failed: $e')),
                      );
                  }
                },
                onDown: () async {
                  try {
                    await ref
                        .read(apiServiceProvider)
                        .voteForumTopic(topicId, -1);
                    ref.invalidate(_forumTopicProvider(topicId));
                  } catch (e) {
                    if (context.mounted)
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Vote failed: $e')),
                      );
                  }
                },
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            reply['author_name']?.toString() ?? 'user',
                            style: AppTypography.labelSm.copyWith(
                              color: AppColors.onSurfaceVariant,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (reply['created_at'] != null)
                          Text(
                            reply['created_at'].toString(),
                            style: const TextStyle(
                              color: AppColors.onSurfaceVariant,
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      reply['content']?.toString() ?? '',
                      style: AppTypography.bodyMd,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (isNested && children.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(
                left: (40 + depth * 20).toDouble(),
                top: 8,
              ),
              child: Column(
                children: children
                    .map(
                      (c) => _ReplyTile(
                        reply: c as Map<String, dynamic>,
                        depth: depth + 1,
                        topicId: topicId,
                      ),
                    )
                    .toList(),
              ),
            )
          else if (!isNested)
            Padding(
              padding: const EdgeInsets.only(left: 40, top: 8),
              child: Text(
                '…',
                style: const TextStyle(color: AppColors.onSurfaceVariant),
              ),
            ),
        ],
      ),
    );
    if (depth == 0) return card;
    return Padding(
      padding: EdgeInsets.only(left: (depth * 20).clamp(0, 60).toDouble()),
      child: card,
    );
  }
}
