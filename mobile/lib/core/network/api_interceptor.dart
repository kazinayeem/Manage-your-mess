import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import '../../app/config/env.dart';

class ApiInterceptor extends Interceptor {
  final SecureStorageService _storage;
  final Dio _dio;

  ApiInterceptor(this._storage, this._dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    final activeMessId = await _storage.getActiveMessId();
    if (activeMessId != null && activeMessId.isNotEmpty) {
      options.headers['x-mess-id'] = activeMessId;
    }

    options.headers['Accept'] = 'application/json';
    options.headers['Content-Type'] = 'application/json';

    return super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && !err.requestOptions.path.contains('/auth/refresh')) {
      // Try refresh token
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        try {
          final refreshResponse = await _dio.post(
            '${EnvConfig.apiBaseUrl}/auth/refresh',
            data: {'refreshToken': refreshToken},
          );

          if (refreshResponse.statusCode == 200 && refreshResponse.data['success'] == true) {
            final newAccessToken = refreshResponse.data['data']['accessToken'];
            final newRefreshToken = refreshResponse.data['data']['refreshToken'];

            await _storage.saveAccessToken(newAccessToken);
            await _storage.saveRefreshToken(newRefreshToken);

            // Retry original request
            final opts = err.requestOptions;
            opts.headers['Authorization'] = 'Bearer $newAccessToken';

            final retryResponse = await _dio.fetch(opts);
            return handler.resolve(retryResponse);
          }
        } catch (e) {
          await _storage.clearAll();
        }
      }
    }
    return super.onError(err, handler);
  }
}
