import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final bool fullWidth;
  final IconData? icon;
  final bool outlined;
  final bool text;
  final Color? color;
  final double? height;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.fullWidth = true,
    this.icon,
    this.outlined = false,
    this.text = false,
    this.color,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    if (text) {
      return TextButton(
        onPressed: loading ? null : onPressed,
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(
                label,
                style: const TextStyle(
                  color: AppColors.primaryPink,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
      );
    }
    if (outlined) {
      return SizedBox(
        width: fullWidth ? double.infinity : null,
        height: height ?? 48,
        child: OutlinedButton(
          onPressed: loading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: color ?? AppColors.white,
            side: BorderSide(
              color: color ?? AppColors.white.withValues(alpha: 0.2),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: _buildChild(),
        ),
      );
    }
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: height ?? 48,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? AppColors.primaryContainer,
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 2,
          shadowColor: const Color(0x4D7F1D1D),
        ),
        child: _buildChild(),
      ),
    );
  }

  Widget _buildChild() {
    if (loading) {
      return const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
      );
    }
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ],
      );
    }
    return Text(
      label,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    );
  }
}

class AppInput extends StatelessWidget {
  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final IconData? icon;
  final bool obscureText;
  final String? error;
  final Widget? suffix;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;

  const AppInput({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.icon,
    this.obscureText = false,
    this.error,
    this.suffix,
    this.keyboardType,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(label!, style: AppTypography.labelMd),
          ),
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          onChanged: onChanged,
          style: const TextStyle(color: AppColors.onSurface, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: AppColors.onSurfaceVariant.withValues(alpha: 0.5),
              fontSize: 15,
            ),
            prefixIcon: icon != null
                ? Icon(icon, color: AppColors.onSurfaceVariant, size: 20)
                : null,
            suffixIcon: suffix,
            errorText: error,
            errorMaxLines: 2,
            filled: true,
            fillColor: AppColors.surfaceContainerLow,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppColors.primaryContainer,
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class AppBadge extends StatelessWidget {
  final String label;
  final Color? color;

  const AppBadge({super.key, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      decoration: BoxDecoration(
        color: (color ?? AppColors.primary).withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(9999),
        border: Border.all(
          color: (color ?? AppColors.primary).withValues(alpha: 0.4),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color ?? AppColors.primary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class PremiumBadge extends StatelessWidget {
  final double size;

  const PremiumBadge({super.key, this.size = 16});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: size * 0.5, vertical: 2),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryContainer, AppColors.primaryAccent],
        ),
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star, size: size * 0.75, color: Colors.black),
          const SizedBox(width: 2),
          Text(
            'Premium',
            style: TextStyle(
              fontSize: size * 0.5,
              fontWeight: FontWeight.w700,
              color: Colors.black,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class RatingBadge extends StatelessWidget {
  final double rating;
  final double maxRating;

  const RatingBadge({super.key, required this.rating, this.maxRating = 10});

  @override
  Widget build(BuildContext context) {
    final pct = rating / maxRating;
    final color = pct >= 0.7
        ? AppColors.primaryContainer
        : (pct >= 0.5 ? AppColors.primary : Colors.red.shade400);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star, size: 12, color: color),
          const SizedBox(width: 2),
          Text(
            rating.toStringAsFixed(1),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class LoadingSpinner extends StatelessWidget {
  final double size;
  final Color? color;

  const LoadingSpinner({
    super.key,
    this.size = 50,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        strokeWidth: 3,
        valueColor: AlwaysStoppedAnimation(color ?? AppColors.primary),
      ),
    );
  }
}

class AppSkeleton extends StatelessWidget {
  final double? width;
  final double? height;
  final double borderRadius;

  const AppSkeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 8,
  });

  factory AppSkeleton.card() =>
      AppSkeleton(width: 160, height: 240, borderRadius: 12);
  factory AppSkeleton.poster() =>
      AppSkeleton(width: 120, height: 180, borderRadius: 8);
  factory AppSkeleton.text() => AppSkeleton(height: 16, borderRadius: 4);
  factory AppSkeleton.hero() => AppSkeleton(height: 400, borderRadius: 0);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class AppModal extends StatelessWidget {
  final String title;
  final Widget content;
  final List<Widget>? actions;

  const AppModal({
    super.key,
    required this.title,
    required this.content,
    this.actions,
  });

  static Future<T?> show<T>(
    BuildContext context, {
    required String title,
    required Widget content,
    List<Widget>? actions,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      backgroundColor: AppColors.surfaceContainer,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) =>
          AppModal(title: title, content: content, actions: actions),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.headlineSm),
          const SizedBox(height: 16),
          content,
          if (actions != null) ...[
            const SizedBox(height: 16),
            Row(mainAxisAlignment: MainAxisAlignment.end, children: actions!),
          ],
        ],
      ),
    );
  }
}

class AppTabs extends StatelessWidget {
  final List<String> tabs;
  final int activeIndex;
  final ValueChanged<int> onChanged;
  final bool scrollable;

  const AppTabs({
    super.key,
    required this.tabs,
    required this.activeIndex,
    required this.onChanged,
    this.scrollable = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: SizedBox(
        height: 36,
        child: scrollable
            ? ListView(scrollDirection: Axis.horizontal, children: _buildTabs())
            : Row(children: _buildTabs()),
      ),
    );
  }

  List<Widget> _buildTabs() {
    return List.generate(tabs.length, (i) {
      final isActive = i == activeIndex;
      final tab = GestureDetector(
        onTap: () => onChanged(i),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          alignment: Alignment.center,
          padding: EdgeInsets.symmetric(horizontal: scrollable ? 20 : 8),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primaryContainer : AppColors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            tabs[i],
            style: TextStyle(
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isActive ? Colors.white : AppColors.onSurfaceVariant,
            ),
          ),
        ),
      );
      return scrollable ? Padding(padding: const EdgeInsets.only(right: 4), child: tab) : Expanded(child: tab);
    });
  }
}

class LockedOverlay extends StatelessWidget {
  final String message;

  const LockedOverlay({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: Colors.black54,
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock, color: Colors.white, size: 32),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(color: Colors.white, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class AppDropdown extends StatelessWidget {
  final String? value;
  final List<String> items;
  final ValueChanged<String?> onChanged;
  final String? label;

  const AppDropdown({
    super.key,
    this.value,
    required this.items,
    required this.onChanged,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(label!, style: AppTypography.labelSm),
          ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.outlineVariant),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: AppColors.surfaceContainerHigh,
              items: items
                  .map(
                    (e) => DropdownMenuItem(
                      value: e,
                      child: Text(
                        e,
                        style: const TextStyle(color: AppColors.onSurface),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}

class FollowButton extends ConsumerWidget {
  final String creatorId;
  final bool isFollowing;

  const FollowButton({
    super.key,
    required this.creatorId,
    required this.isFollowing,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppButton(
      label: isFollowing ? 'Following' : 'Follow',
      onPressed: () {},
      outlined: isFollowing,
      fullWidth: false,
      height: 36,
    );
  }
}

class AppBackButton extends StatelessWidget {
  final VoidCallback? onPressed;

  const AppBackButton({super.key, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onPressed ?? () => Navigator.of(context).maybePop(),
      tooltip: 'Back',
      icon: const Icon(
        Icons.arrow_back_ios_new,
        color: AppColors.onSurface,
        size: 20,
      ),
      style: IconButton.styleFrom(
        backgroundColor: AppColors.surfaceContainerLow,
        side: const BorderSide(color: AppColors.outlineVariant),
      ),
    );
  }
}

class ComingSoonView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const ComingSoonView({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 56,
              color: AppColors.onSurfaceVariant.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: AppTypography.headlineSm.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
