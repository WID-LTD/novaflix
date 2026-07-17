import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class LearnScreen extends StatelessWidget {
  const LearnScreen({super.key});

  static const _courses = [
    {'title': 'Introduction to Filmmaking', 'instructor': 'James Cameron', 'lessons': '12 lessons', 'duration': '8h 30m', 'rating': '4.8', 'premium': true},
    {'title': 'Screenwriting Masterclass', 'instructor': 'Aaron Sorkin', 'lessons': '8 lessons', 'duration': '6h 15m', 'rating': '4.7', 'premium': true},
    {'title': 'Cinematography Basics', 'instructor': 'Roger Deakins', 'lessons': '10 lessons', 'duration': '7h 0m', 'rating': '4.9', 'premium': false},
    {'title': 'Video Editing 101', 'instructor': 'Thelma Schoonmaker', 'lessons': '6 lessons', 'duration': '4h 45m', 'rating': '4.6', 'premium': false},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('E-Learning')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: _courses.map((c) => Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(c['title'] as String, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.white)),
                  ),
                  if (c['premium'] == true) Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: AppTheme.red, borderRadius: BorderRadius.circular(4)),
                    child: const Text('PREMIUM', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.white)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('By ${c['instructor']}', style: const TextStyle(color: AppTheme.gray, fontSize: 13)),
              const SizedBox(height: 8),
              Row(children: [
                Icon(Icons.menu_book, size: 14, color: AppTheme.gray.withValues(alpha: 0.7)),
                const SizedBox(width: 4),
                Text(c['lessons'].toString(), style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7), fontSize: 12)),
                const SizedBox(width: 16),
                Icon(Icons.access_time, size: 14, color: AppTheme.gray.withValues(alpha: 0.7)),
                const SizedBox(width: 4),
                Text(c['duration'].toString(), style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7), fontSize: 12)),
                const SizedBox(width: 16),
                Icon(Icons.star, size: 14, color: AppTheme.red),
                const SizedBox(width: 4),
                Text(c['rating'].toString(), style: const TextStyle(color: AppTheme.red, fontSize: 12, fontWeight: FontWeight.w600)),
              ]),
              const SizedBox(height: 12),
              SizedBox(width: double.infinity, child: ElevatedButton(
                onPressed: () {},
                child: Text(c['premium'] == true ? 'Unlock' : 'Start Learning'),
              )),
            ],
          ),
        )).toList(),
      ),
    );
  }
}
