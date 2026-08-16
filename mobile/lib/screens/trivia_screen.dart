import 'dart:ui' show ImageFilter;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _coinsProvider = FutureProvider<int>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = (await api.getCoinsBalance()).data;
  return (data is Map && data['coins'] is num)
      ? (data['coins'] as num).toInt()
      : 0;
});

final _dailyTriviaProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final data = (await api.getDailyTrivia()).data;
  return ((data is Map ? data['questions'] : null) as List? ?? [])
      .cast<Map<String, dynamic>>();
});

final _guessProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final data = (await api.getGuessMovie()).data;
  if (data is! Map || data['question'] is! Map) return <String, dynamic>{};
  return Map<String, dynamic>.from(data['question'] as Map);
});

final _cosmeticsProvider =
    FutureProvider<({List<Map<String, dynamic>> items, int coins})>((
      ref,
    ) async {
      final api = ref.read(apiServiceProvider);
      final data = (await api.getCosmetics()).data;
      final items = ((data is Map ? data['cosmetics'] : null) as List? ?? [])
          .cast<Map<String, dynamic>>();
      final coins = (data is Map && data['coins'] is num)
          ? (data['coins'] as num).toInt()
          : 0;
      return (items: items, coins: coins);
    });

final _leaderboardProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final data = (await api.getTriviaLeaderboard()).data;
  return ((data is Map ? data['leaderboard'] : null) as List? ?? [])
      .cast<Map<String, dynamic>>();
});

class TriviaScreen extends ConsumerStatefulWidget {
  const TriviaScreen({super.key});

  @override
  ConsumerState<TriviaScreen> createState() => _TriviaScreenState();
}

class _TriviaScreenState extends ConsumerState<TriviaScreen> {
  static const _tabs = [
    'Daily Trivia',
    'Guess the Movie',
    'Cosmetics Shop',
    'Leaderboard',
  ];

  int _tab = 0;

  int _qIndex = 0;
  int? _selected;
  bool _dailyBusy = false;
  int _correctCount = 0;
  int _coinsEarned = 0;
  int _streak = 0;
  bool _dailyDone = false;

  int? _guessSelected;
  Map<String, dynamic>? _guessResult;
  bool _guessBusy = false;

  int _int(dynamic v, [int fallback = 0]) => v is num ? v.toInt() : fallback;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Trivia & Rewards'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(child: _buildCoinsPill()),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: AppTabs(
              tabs: _tabs,
              activeIndex: _tab,
              onChanged: _onTabChanged,
              scrollable: true,
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildCoinsPill() {
    return ref
        .watch(_coinsProvider)
        .when(
          data: (coins) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.outlineVariant),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.star_rounded,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  '$coins',
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          loading: () => Container(
            width: 44,
            height: 26,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(999),
            ),
            child: const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(AppColors.primary),
              ),
            ),
          ),
          error: (_, _) => const SizedBox.shrink(),
        );
  }

  void _onTabChanged(int i) {
    setState(() => _tab = i);
    if (i == 1) ref.invalidate(_guessProvider);
    if (i == 2) ref.invalidate(_cosmeticsProvider);
    if (i == 3) ref.invalidate(_leaderboardProvider);
    ref.invalidate(_coinsProvider);
  }

  Widget _buildBody() {
    switch (_tab) {
      case 0:
        return _buildDaily();
      case 1:
        return _buildGuess();
      case 2:
        return _buildShop();
      default:
        return _buildLeaderboard();
    }
  }

  // ---------- Tab 1: Daily Trivia ----------

  Widget _buildDaily() {
    final trivia = ref.watch(_dailyTriviaProvider);
    return trivia.when(
      loading: () => const LoadingSpinner(logo: true),
      error: (e, _) => Center(
        child: Text(
          'Error: $e',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
      data: (items) {
        if (_dailyDone) return _buildDailyResult(items.length);
        if (items.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.quiz_outlined,
                  size: 64,
                  color: AppColors.onSurfaceVariant,
                ),
                const SizedBox(height: 16),
                Text(
                  'No trivia available today — check back soon!',
                  textAlign: TextAlign.center,
                  style: AppTypography.bodyMd.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        }
        final qi = _qIndex < items.length ? _qIndex : items.length - 1;
        final q = items[qi];
        final options =
            (q['options'] as List?)?.map((o) => o.toString()).toList() ??
            <String>[];
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Text(
                  'Question ${qi + 1} of ${items.length}',
                  style: AppTypography.labelXs.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                ...List.generate(items.length, (i) {
                  final color = i < qi
                      ? AppColors.secondary
                      : i == qi
                      ? AppColors.primary
                      : AppColors.onSurfaceVariant.withValues(alpha: 0.35);
                  return Container(
                    width: 6,
                    height: 6,
                    margin: const EdgeInsets.only(left: 4),
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  );
                }),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (q['image_url'] != null) ...[
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: SizedBox(
                            width: 44,
                            height: 56,
                            child: CachedNetworkImage(
                              imageUrl: q['image_url'].toString(),
                              fit: BoxFit.cover,
                              placeholder: (_, _) => Container(
                                color: AppColors.surfaceContainerHighest,
                              ),
                              errorWidget: (_, _, _) => Container(
                                color: AppColors.surfaceContainerHighest,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _difficultyBadge(q['difficulty']?.toString()),
                            const SizedBox(height: 6),
                            Text(
                              q['question']?.toString() ?? '',
                              style: AppTypography.bodyMd.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(options.length, (i) {
                    return _optionTile(
                      label: options[i],
                      index: i,
                      selected: _selected == i,
                      disabled: _dailyBusy,
                      onTap: _dailyBusy
                          ? null
                          : () => _pickAnswer(q, i, items.length),
                    );
                  }),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _pickAnswer(Map<String, dynamic> q, int idx, int total) async {
    if (_dailyBusy || _selected != null) return;
    final api = ref.read(apiServiceProvider);
    setState(() {
      _selected = idx;
      _dailyBusy = true;
    });
    try {
      final res = await api.dio.post(
        '/trivia/submit',
        data: {
          'answers': [
            {'id': q['id'], 'answerIndex': idx},
          ],
        },
      );
      final body = res.data;
      if (!mounted) return;
      if (body is Map && body['success'] == true) {
        final correct = _int(body['score']) == 1;
        final isLast = idx >= total - 1;
        ref.invalidate(_coinsProvider);
        setState(() {
          if (correct) _correctCount++;
          _coinsEarned += _int(body['coinsEarned']);
          _streak = _int(body['streak'], _streak);
          _selected = null;
          _dailyBusy = false;
          if (isLast) {
            _dailyDone = true;
          } else {
            _qIndex = idx + 1;
          }
        });
      } else {
        setState(() {
          _selected = null;
          _dailyBusy = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _selected = null;
          _dailyBusy = false;
        });
        _floatError('Could not submit your answer. Try again.');
      }
    }
  }

  Widget _buildDailyResult(int total) {
    final pct = total > 0 ? _correctCount / total : 0.0;
    final good = pct >= 0.5;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              Icons.emoji_events_rounded,
              size: 56,
              color: good ? AppColors.secondary : AppColors.primaryLight,
            ),
            const SizedBox(height: 12),
            Text(
              good ? 'Nice job!' : 'Keep going!',
              style: AppTypography.headlineSm,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'You scored $_correctCount of $total questions.',
              textAlign: TextAlign.center,
              style: AppTypography.bodyMd.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 8,
                backgroundColor: AppColors.surfaceContainerHighest,
                color: good ? AppColors.secondary : AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.star_rounded,
                  size: 18,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 6),
                Text(
                  '+$_coinsEarned coins earned',
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.local_fire_department,
                  size: 18,
                  color: AppColors.secondary,
                ),
                const SizedBox(width: 6),
                Text(
                  'Streak: $_streak',
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            AppButton(label: 'Play again', onPressed: _playAgain),
            const SizedBox(height: 8),
            AppButton(
              label: 'Spend coins',
              outlined: true,
              onPressed: () => _onTabChanged(2),
            ),
          ],
        ),
      ),
    );
  }

  void _playAgain() {
    ref.invalidate(_dailyTriviaProvider);
    setState(() {
      _qIndex = 0;
      _selected = null;
      _dailyBusy = false;
      _correctCount = 0;
      _coinsEarned = 0;
      _streak = 0;
      _dailyDone = false;
    });
  }

  // ---------- Tab 2: Guess the Movie ----------

  Widget _buildGuess() {
    final guess = ref.watch(_guessProvider);
    return guess.when(
      loading: () => const LoadingSpinner(logo: true),
      error: (e, _) => Center(
        child: Text(
          'Error: $e',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
      data: (q) {
        if (q.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.movie_outlined,
                  size: 64,
                  color: AppColors.onSurfaceVariant,
                ),
                const SizedBox(height: 16),
                Text(
                  'No movie to guess right now.',
                  style: AppTypography.bodyMd.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        }
        final imageUrl = q['image_url']?.toString();
        final clue = q['clue']?.toString();
        final options =
            (q['options'] as List?)?.map((o) => o.toString()).toList() ??
            <String>[];
        final hasResult = _guessResult != null;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Guess the Movie',
                    style: AppTypography.headlineSm,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '15 coins per correct guess',
                    textAlign: TextAlign.center,
                    style: AppTypography.bodySm.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _blurredPoster(imageUrl),
                  if (clue != null && clue.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      '“$clue…”',
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySm.copyWith(
                        color: AppColors.onSurfaceVariant,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  ...List.generate(options.length, (i) {
                    final picked = _guessSelected == i;
                    Color? accent;
                    IconData? trailing;
                    if (hasResult && picked) {
                      final correct = _guessResult?['correct'] == true;
                      accent = correct ? AppColors.secondary : AppColors.error;
                      trailing = correct ? Icons.check_circle : Icons.cancel;
                    }
                    return _optionTile(
                      label: options[i],
                      index: i,
                      selected: hasResult ? picked : false,
                      accent: accent,
                      trailingIcon: trailing,
                      disabled: _guessBusy || _guessSelected != null,
                      onTap: (_guessBusy || _guessSelected != null)
                          ? null
                          : () => _submitGuess(q, i),
                    );
                  }),
                ],
              ),
            ),
            if (hasResult) ...[const SizedBox(height: 12), _buildGuessResult()],
          ],
        );
      },
    );
  }

  Future<void> _submitGuess(Map<String, dynamic> q, int idx) async {
    if (_guessBusy || _guessSelected != null) return;
    final api = ref.read(apiServiceProvider);
    setState(() {
      _guessBusy = true;
      _guessSelected = idx;
    });
    try {
      final res = await api.dio.post(
        '/trivia/guess/submit',
        data: {'questionId': q['id'], 'answerIndex': idx},
      );
      final body = res.data;
      if (!mounted) return;
      if (body is Map && body['success'] == true) {
        ref.invalidate(_coinsProvider);
        setState(() {
          _guessResult = Map<String, dynamic>.from(body);
          _guessBusy = false;
        });
      } else {
        setState(() {
          _guessSelected = null;
          _guessBusy = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _guessSelected = null;
          _guessBusy = false;
        });
        _floatError('Could not submit your guess. Try again.');
      }
    }
  }

  Widget _buildGuessResult() {
    final correct = _guessResult?['correct'] == true;
    final answer = _guessResult?['answer']?.toString() ?? '';
    final coins = _int(_guessResult?['coinsEarned']);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(
                correct ? Icons.check_circle : Icons.cancel,
                size: 22,
                color: correct ? AppColors.secondary : AppColors.error,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  correct ? 'Correct! It was $answer' : 'Nope — it was $answer',
                  style: AppTypography.bodyMd.copyWith(
                    color: correct ? AppColors.secondary : AppColors.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (coins > 0) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.star_rounded,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 4),
                Text('+$coins coins', style: AppTypography.labelMd),
              ],
            ),
          ],
          const SizedBox(height: 16),
          AppButton(label: 'Next movie', onPressed: _nextGuess),
        ],
      ),
    );
  }

  void _nextGuess() {
    setState(() {
      _guessSelected = null;
      _guessResult = null;
      _guessBusy = false;
    });
    ref.invalidate(_guessProvider);
    ref.invalidate(_coinsProvider);
  }

  Widget _blurredPoster(String? url) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Stack(
        children: [
          if (url != null)
            ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: CachedNetworkImage(
                imageUrl: url,
                height: 240,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, _) => Container(
                  height: 240,
                  color: AppColors.surfaceContainerHigh,
                ),
                errorWidget: (_, _, _) => Container(
                  height: 240,
                  color: AppColors.surfaceContainerHighest,
                  child: const Icon(
                    Icons.movie_creation_outlined,
                    size: 40,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            )
          else
            Container(
              height: 240,
              width: double.infinity,
              color: AppColors.surfaceContainerHigh,
              child: const Icon(
                Icons.movie_creation_outlined,
                size: 40,
                color: AppColors.onSurfaceVariant,
              ),
            ),
          Positioned.fill(
            child: Container(color: AppColors.black.withValues(alpha: 0.4)),
          ),
          if (_guessSelected == null && url != null)
            Positioned.fill(
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Can you name it?',
                    style: TextStyle(
                      color: AppColors.onSurfaceVariant,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ---------- Tab 3: Cosmetics Shop ----------

  Widget _buildShop() {
    final shop = ref.watch(_cosmeticsProvider);
    return shop.when(
      loading: () => const LoadingSpinner(logo: true),
      error: (e, _) => Center(
        child: Text(
          'Error: $e',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
      data: (data) {
        if (data.items.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.shopping_bag_outlined,
                  size: 64,
                  color: AppColors.onSurfaceVariant,
                ),
                const SizedBox(height: 16),
                Text(
                  'The shop is empty right now.',
                  style: AppTypography.bodyMd.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: gridColumnsFor(MediaQuery.sizeOf(context).width),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.66,
          ),
          itemCount: data.items.length,
          itemBuilder: (_, i) {
            final item = data.items[i];
            return _CosmeticCard(
              item: item,
              coins: data.coins,
              onBuy: () => _buyCosmetic(item),
              onEquip: () => _equipCosmetic(item),
            );
          },
        );
      },
    );
  }

  Future<void> _buyCosmetic(Map<String, dynamic> item) async {
    final api = ref.read(apiServiceProvider);
    try {
      await api.purchaseCosmetic(_itemId(item));
      if (mounted) {
        ref.invalidate(_cosmeticsProvider);
        ref.invalidate(_coinsProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bought ${item['name']?.toString() ?? 'cosmetic'}!'),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    } catch (_) {
      if (mounted) _floatError('Could not buy that item.');
    }
  }

  Future<void> _equipCosmetic(Map<String, dynamic> item) async {
    final api = ref.read(apiServiceProvider);
    try {
      await api.equipCosmetic(_itemId(item));
      if (mounted) {
        ref.invalidate(_cosmeticsProvider);
        ref.invalidate(_coinsProvider);
      }
    } catch (_) {
      if (mounted) _floatError('Could not equip that item.');
    }
  }

  int _itemId(Map<String, dynamic> item) {
    final id = item['id'];
    return id is num ? id.toInt() : int.tryParse(id.toString()) ?? 0;
  }

  // ---------- Tab 4: Leaderboard ----------

  Widget _buildLeaderboard() {
    final board = ref.watch(_leaderboardProvider);
    return board.when(
      loading: () => const LoadingSpinner(logo: true),
      error: (e, _) => Center(
        child: Text(
          'Error: $e',
          style: const TextStyle(color: AppColors.error),
        ),
      ),
      data: (rows) {
        if (rows.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.leaderboard_outlined,
                  size: 64,
                  color: AppColors.onSurfaceVariant,
                ),
                const SizedBox(height: 16),
                Text(
                  'No trivia played yet — be the first!',
                  style: AppTypography.bodyMd.copyWith(
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: rows.length,
          itemBuilder: (_, i) => _LeaderboardTile(rank: i + 1, row: rows[i]),
        );
      },
    );
  }

  // ---------- Shared widgets ----------

  Widget _optionTile({
    required String label,
    required int index,
    bool selected = false,
    bool disabled = false,
    Color? accent,
    IconData? trailingIcon,
    VoidCallback? onTap,
  }) {
    final color =
        accent ?? (selected ? AppColors.primary : AppColors.onSurface);
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected
                ? (accent ?? AppColors.primary)
                : AppColors.transparent,
            width: 1.4,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                '${String.fromCharCode(65 + index)}. $label',
                style: AppTypography.bodyMd.copyWith(
                  color: color,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
            if (trailingIcon != null)
              Icon(
                trailingIcon,
                size: 18,
                color: accent ?? AppColors.onSurfaceVariant,
              ),
          ],
        ),
      ),
    );
  }

  Widget _difficultyBadge(String? difficulty) {
    final Color color;
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        color = AppColors.secondary;
        break;
      case 'medium':
        color = AppColors.primaryLight;
        break;
      case 'hard':
        color = AppColors.error;
        break;
      default:
        color = AppColors.onSurfaceVariant;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        (difficulty ?? 'trivia').toUpperCase(),
        style: AppTypography.labelXs.copyWith(color: color),
      ),
    );
  }

  void _floatError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.errorContainer,
      ),
    );
  }
}

class _CosmeticCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final int coins;
  final Future<void> Function() onBuy;
  final Future<void> Function() onEquip;

  const _CosmeticCard({
    required this.item,
    required this.coins,
    required this.onBuy,
    required this.onEquip,
  });

  @override
  Widget build(BuildContext context) {
    final owned = item['owned'] == true;
    final equipped = item['equipped'] == true;
    final price = item['price'] is num ? (item['price'] as num).toInt() : 0;
    final icon = item['icon']?.toString() ?? '';
    final name = item['name']?.toString() ?? 'Cosmetic';
    final description = item['description']?.toString();
    final kind = item['kind']?.toString() ?? item['type']?.toString() ?? '';
    final canBuy = coins >= price;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          icon.isNotEmpty
              ? Text(icon, style: const TextStyle(fontSize: 28))
              : const Icon(
                  Icons.auto_awesome,
                  size: 28,
                  color: AppColors.onSurfaceVariant,
                ),
          if (kind.isNotEmpty)
            Text(
              kind.replaceAll('_', ' ').toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.labelXs.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: AppTypography.labelSm.copyWith(color: AppColors.onSurface),
          ),
          if (description != null)
            Text(
              description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 10),
            ),
          if (owned)
            SizedBox(
              width: double.infinity,
              height: 30,
              child: TextButton(
                onPressed: equipped ? null : onEquip,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  backgroundColor: equipped
                      ? AppColors.surfaceContainerHighest
                      : AppColors.primary,
                  foregroundColor: equipped
                      ? AppColors.onSurfaceVariant
                      : AppColors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  equipped ? 'Equipped' : 'Equip',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            )
          else
            SizedBox(
              width: double.infinity,
              height: 30,
              child: TextButton(
                onPressed: canBuy ? onBuy : null,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  backgroundColor: AppColors.primaryContainer,
                  foregroundColor: canBuy
                      ? AppColors.white
                      : AppColors.onSurfaceVariant,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  '$price coins',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _LeaderboardTile extends StatelessWidget {
  final int rank;
  final Map<String, dynamic> row;

  const _LeaderboardTile({required this.rank, required this.row});

  @override
  Widget build(BuildContext context) {
    final name = row['name']?.toString() ?? 'Anonymous';
    final points = row['points'] ?? row['score'] ?? 0;
    final correct = row['correct'];
    final answered = row['answered'];
    final avatar = row['avatar']?.toString();
    final badgeColor = rank == 1
        ? AppColors.primary
        : rank == 2
        ? AppColors.onSurface
        : rank == 3
        ? AppColors.primaryLight
        : AppColors.onSurfaceVariant;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: badgeColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Text(
              '$rank',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: badgeColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          CircleAvatar(
            radius: 14,
            backgroundColor: AppColors.surfaceContainerHighest,
            backgroundImage: avatar != null ? NetworkImage(avatar) : null,
            child: avatar == null
                ? const Icon(
                    Icons.person,
                    size: 16,
                    color: AppColors.onSurfaceVariant,
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.onSurface,
                  ),
                ),
                if (correct != null)
                  Text(
                    '$correct/${answered ?? 0} correct',
                    style: TextStyle(
                      color: AppColors.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${points is num ? points.toInt() : points} pts',
            style: AppTypography.labelMd.copyWith(
              color: AppColors.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
