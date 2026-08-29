import 'package:flutter/material.dart';

String formatProgress(double progress, double duration) {
  if (duration <= 0) return '${(progress / 60).round()}m';

  final progressMins = (progress / 60).round();
  final durationMins = (duration / 60).round();
  return '$progressMins m / $durationMins m';
}

String formatDuration(double seconds) {
  if (seconds < 60) return '${seconds.toStringAsFixed(0)}s';
  final minutes = (seconds / 60).floor();
  final secondsRemaining = (seconds % 60).round();
  if (minutes < 60) return '${minutes}m ${secondsRemaining}s';
  final hours = (minutes / 60).floor();
  final minutesRemaining = minutes % 60;
  if (hours < 24) return '${hours}h ${minutesRemaining}m';
  final days = (hours / 24).floor();
  final hoursRemaining = hours % 24;
  return '${days}d ${hoursRemaining}h';
}

String formatShortDuration(double seconds) {
  final hours = (seconds / 3600).floor();
  final minutes = ((seconds % 3600) / 60).floor();
  final secondsRemaining = (seconds % 60).round();

  if (hours > 0) {
    return '${hours}h ${minutes}m';
  } else if (minutes > 0) {
    return '${minutes}m ${secondsRemaining}s';
  }
  return '${secondsRemaining}s';
}