class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final ApiMeta? meta;
  final ApiErrorDetails? error;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.meta,
    this.error,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic json)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'],
      meta: json['meta'] != null ? ApiMeta.fromJson(json['meta']) : null,
      error: json['error'] != null ? ApiErrorDetails.fromJson(json['error']) : null,
    );
  }
}

class ApiMeta {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  ApiMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory ApiMeta.fromJson(Map<String, dynamic> json) {
    return ApiMeta(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 0,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
    );
  }
}

class ApiErrorDetails {
  final String code;
  final dynamic details;

  ApiErrorDetails({required this.code, this.details});

  factory ApiErrorDetails.fromJson(Map<String, dynamic> json) {
    return ApiErrorDetails(
      code: json['code'] ?? 'UNKNOWN_ERROR',
      details: json['details'],
    );
  }
}
