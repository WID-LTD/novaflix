class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;

  ApiResponse({required this.success, this.data, this.error});

  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(dynamic)? parser) {
    return ApiResponse(
      success: json['success'] as bool? ?? false,
      data: parser != null && json['data'] != null ? parser(json['data']) : json['data'] as T?,
      error: json['error'] as String?,
    );
  }
}
