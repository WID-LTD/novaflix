class Creator {
  final int id;
  final String username;
  final String? avatar;
  final String? bio;
  final String? department;
  final int filmCount;
  final int totalLikes;
  final int totalViews;

  Creator({
    required this.id,
    required this.username,
    this.avatar,
    this.bio,
    this.department,
    this.filmCount = 0,
    this.totalLikes = 0,
    this.totalViews = 0,
  });

  factory Creator.fromJson(Map<String, dynamic> json) => Creator(
    id: json['id'] as int,
    username: json['username'] as String? ?? json['name'] as String? ?? '',
    avatar: json['avatar'] as String? ?? json['profile_path'] as String?,
    bio: json['bio'] as String?,
    department: json['department'] as String? ?? json['known_for_department'] as String?,
    filmCount: (json['film_count'] ?? json['total_films'] ?? 0) as int,
    totalLikes: (json['total_likes'] ?? 0) as int,
    totalViews: (json['total_views'] ?? 0) as int,
  );

  String? get avatarUrl => avatar != null && avatar!.startsWith('/')
      ? 'https://image.tmdb.org/t/p/w185$avatar'
      : avatar;
}
