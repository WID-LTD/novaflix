class StoreItem {
  final int id;
  final String name;
  final String? image;
  final double price;
  final String category;

  StoreItem({
    required this.id,
    required this.name,
    this.image,
    required this.price,
    required this.category,
  });

  factory StoreItem.fromJson(Map<String, dynamic> json) => StoreItem(
    id: json['id'] as int,
    name: json['name'] as String,
    image: json['image'] as String?,
    price: (json['price'] as num).toDouble(),
    category: json['category'] as String? ?? 'All',
  );
}

class Course {
  final int id;
  final String title;
  final String? instructor;
  final String? thumbnail;
  final int lessonCount;
  final int duration;
  final double rating;
  final bool isPremium;

  Course({
    required this.id,
    required this.title,
    this.instructor,
    this.thumbnail,
    this.lessonCount = 0,
    this.duration = 0,
    this.rating = 0,
    this.isPremium = false,
  });

  factory Course.fromJson(Map<String, dynamic> json) => Course(
    id: json['id'] as int,
    title: json['title'] as String,
    instructor: json['instructor'] as String?,
    thumbnail: json['thumbnail'] as String?,
    lessonCount: (json['lesson_count'] ?? 0) as int,
    duration: (json['duration'] ?? 0) as int,
    rating: (json['rating'] as num?)?.toDouble() ?? 0,
    isPremium: json['is_premium'] as bool? ?? false,
  );
}
