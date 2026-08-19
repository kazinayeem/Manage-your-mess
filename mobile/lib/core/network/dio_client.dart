import 'package:dio/dio.dart';
import '../../app/config/env.dart';
import '../storage/secure_storage.dart';
import 'api_interceptor.dart';

class DioClient {
  late final Dio dio;
  final SecureStorageService storageService;

  DioClient(this.storageService) {
    dio = Dio(
      BaseOptions(
        baseUrl: EnvConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        responseType: ResponseType.json,
      ),
    );

    dio.interceptors.add(ApiInterceptor(storageService, dio));
  }
}
