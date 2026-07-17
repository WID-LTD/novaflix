import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class StoreScreen extends StatelessWidget {
  const StoreScreen({super.key});

  static const _categories = ['All', 'T-Shirts', 'Posters', 'Mugs', 'Caps'];
  static const _products = [
    {'name': 'NovaFlix T-Shirt', 'price': '\$29.99', 'category': 'T-Shirts'},
    {'name': 'Limited Edition Poster', 'price': '\$19.99', 'category': 'Posters'},
    {'name': 'NovaFlix Mug', 'price': '\$14.99', 'category': 'Mugs'},
    {'name': 'NovaFlix Cap', 'price': '\$24.99', 'category': 'Caps'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Merch Store')),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: _categories.map((cat) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(cat),
                  backgroundColor: AppTheme.card,
                  labelStyle: const TextStyle(color: AppTheme.white, fontSize: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  onPressed: () {},
                ),
              )).toList(),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.7,
              ),
              itemCount: _products.length,
              itemBuilder: (context, i) {
                final p = _products[i];
                return Container(
                  decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.dark,
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                          ),
                          child: const Center(child: Icon(Icons.shopping_bag, size: 48, color: AppTheme.gray)),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p['name']!, style: const TextStyle(color: AppTheme.white, fontWeight: FontWeight.w600, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(p['price']!, style: const TextStyle(color: AppTheme.red, fontWeight: FontWeight.w700, fontSize: 16)),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
