import 'package:dio/dio.dart';

class AppException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;

  AppException(this.message, {this.code, this.statusCode});

  factory AppException.fromDioError(DioException dioError) {
    switch (dioError.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return AppException('Network timeout. Please check your connection.');
      case DioExceptionType.badResponse:
        final res = dioError.response;
        if (res?.data != null && res?.data is Map) {
          final msg = res?.data['message'] ?? 'An error occurred';
          final code = res?.data['error']?['code'];
          return AppException(msg, code: code, statusCode: res?.statusCode);
        }
        return AppException(
          'Server error (${res?.statusCode ?? 500})',
          statusCode: res?.statusCode,
        );
      case DioExceptionType.cancel:
        return AppException('Request cancelled.');
      case DioExceptionType.connectionError:
        return AppException('Unable to connect to server. You might be offline.');
      default:
        return AppException('Something went wrong. Please try again.');
    }
  }

  @override
  String toString() => message;
}
