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
  bool get isPremium => plan != null && planRank >= 1;
  bool get isStandardPlus => planRank >= 3;
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
    // Tier matrix (locked): free/student/basic/standard/premium
    switch (planRank) {
      case 4: // premium: 4K + Dolby Vision/HDR10, spatial audio, 4 screens, 6 downloads, premier
        return {
          'maxResolution': '4K',
          'maxResolutionNum': 2160,
          'concurrentScreens': 4,
          'downloadDevices': 6,
          'adFree': true,
          'unlimitedSkips': true,
          'spatialAudio': true,
          'hdrDolby': true,
          'premierAccess': true,
        };
      case 3: // standard: 1080p, 2 screens, 2 downloads, ad-free, unlimited skips
        return {
          'maxResolution': '1080p',
          'maxResolutionNum': 1080,
          'concurrentScreens': 2,
          'downloadDevices': 2,
          'adFree': true,
          'unlimitedSkips': true,
          'spatialAudio': false,
          'hdrDolby': false,
          'premierAccess': false,
        };
      case 2: // basic: identical to student but ad-free
        return {
          'maxResolution': '720p',
          'maxResolutionNum': 720,
          'concurrentScreens': 1,
          'downloadDevices': 1,
          'adFree': true,
          'unlimitedSkips': false,
          'spatialAudio': false,
          'hdrDolby': false,
          'premierAccess': false,
        };
      case 1: // student: ads on, 6 skips/hr
        return {
          'maxResolution': '720p',
          'maxResolutionNum': 720,
          'concurrentScreens': 1,
          'downloadDevices': 1,
          'adFree': false,
          'unlimitedSkips': false,
          'spatialAudio': false,
          'hdrDolby': false,
          'premierAccess': false,
        };
      default: // free
        return {
          'maxResolution': '480p',
          'maxResolutionNum': 480,
          'concurrentScreens': 1,
          'downloadDevices': 0,
          'adFree': false,
          'unlimitedSkips': false,
          'spatialAudio': false,
          'hdrDolby': false,
          'premierAccess': false,
        };
    }
  }
}
