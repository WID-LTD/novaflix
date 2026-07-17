class Comment {
  final int id;
  final String text;
  final int userId;
  final String? username;
  final String? userAvatar;
  final String createdAt;

  Comment({
    required this.id,
    required this.text,
    required this.userId,
    this.username,
    this.userAvatar,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) => Comment(
    id: json['id'] as int,
    text: json['text'] as String,
    userId: json['user_id'] as int,
    username: json['username'] as String?,
    userAvatar: json['user_avatar'] as String?,
    createdAt: json['created_at'] as String,
  );
}
