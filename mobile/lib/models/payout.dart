class Payout {
  final int id;
  final double amount;
  final String status;
  final String? bankName;
  final String? accountNumber;
  final String? accountName;
  final String createdAt;

  Payout({
    required this.id,
    required this.amount,
    required this.status,
    this.bankName,
    this.accountNumber,
    this.accountName,
    required this.createdAt,
  });

  factory Payout.fromJson(Map<String, dynamic> json) => Payout(
    id: json['id'] as int,
    amount: (json['amount'] as num).toDouble(),
    status: json['status'] as String,
    bankName: json['bank_name'] as String?,
    accountNumber: json['account_number'] as String?,
    accountName: json['account_name'] as String?,
    createdAt: json['created_at'] as String,
  );
}

class DashboardStats {
  final int totalViews;
  final int totalLikes;
  final int totalComments;
  final int totalFilms;
  final List<Map<String, dynamic>> recentUploads;
  final double? revenue;
  final List<Map<String, dynamic>> recentComments;

  DashboardStats({
    this.totalViews = 0,
    this.totalLikes = 0,
    this.totalComments = 0,
    this.totalFilms = 0,
    this.revenue,
    this.recentUploads = const [],
    this.recentComments = const [],
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
    totalViews: (json['total_views'] ?? 0) as int,
    totalLikes: (json['total_likes'] ?? 0) as int,
    totalComments: (json['total_comments'] ?? 0) as int,
    totalFilms: (json['total_films'] ?? 0) as int,
    revenue: (json['revenue'] as num?)?.toDouble(),
    recentUploads: (json['recent_uploads'] as List?)?.cast<Map<String, dynamic>>() ?? [],
    recentComments: (json['recent_comments'] as List?)?.cast<Map<String, dynamic>>() ?? [],
  );
}
