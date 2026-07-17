class User {
  final int id;
  final String email;
  final String username;
  final String? avatar;
  final String role;
  final String? token;

  User({
    required this.id,
    required this.email,
    required this.username,
    this.avatar,
    required this.role,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json, {String? token}) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String? ?? '',
      username: json['username'] as String? ?? '',
      avatar: json['avatar'] as String?,
      role: json['role'] as String? ?? 'user',
      token: token,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'username': username,
    'avatar': avatar,
    'role': role,
  };

  bool get isCreator => role == 'creator';
  bool get isAdmin => role == 'admin';
  bool get isAuthenticated => token != null;
}
