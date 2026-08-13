class User {
  final String id;
  final String email;
  final String username;
  final String? avatar;
  final String? bio;
  final String role;
  final String? plan;
  final String? token;

  User({
    required this.id,
    required this.email,
    required this.username,
    this.avatar,
    this.bio,
    required this.role,
    this.plan,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json, {String? token}) {
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email'] as String? ?? '',
      username: json['username'] as String? ?? json['name'] as String? ?? '',
      avatar: json['avatar'] as String?,
      bio: json['bio'] as String?,
      role: json['role'] as String? ?? 'user',
      plan: json['plan'] as String? ?? 'free',
      token: token ?? json['token'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'username': username,
    'avatar': avatar,
    'bio': bio,
    'role': role,
    'plan': plan,
  };

  bool get isCreator => role == 'creator';
  bool get isAdmin => role == 'admin';
  bool get isPremium => plan != null && planRank >= 3;
  bool get isAuthenticated => token != null;

  int get planRank {
    switch (plan) {
      case 'free': return 0;
      case 'student': return 1;
      case 'basic': return 2;
      case 'standard': return 3;
      case 'premium': return 4;
      default: return 0;
    }
  }

  bool meetsPlan(String requiredPlan) {
    const ranks = {'free': 0, 'student': 1, 'basic': 2, 'standard': 3, 'premium': 4};
    final required = ranks[requiredPlan] ?? 0;
    return planRank >= required;
  }

  Map<String, dynamic> get planFeatures {
    return {
      'maxResolution': isPremium ? '2160p' : planRank >= 2 ? '720p' : '480p',
      'concurrentScreens': isPremium ? 4 : planRank >= 2 ? 2 : 1,
      'downloadDevices': isPremium ? 6 : planRank >= 1 ? 1 : 0,
      'adFree': planRank >= 3,
      'unlimitedSkips': planRank >= 3,
    };
  }
}
