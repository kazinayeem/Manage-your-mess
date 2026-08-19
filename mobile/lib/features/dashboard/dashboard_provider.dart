import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/global_providers.dart';

final dashboardAnalyticsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/analytics/dashboard');
  if (response.data['success'] == true) {
    return response.data['data'] as Map<String, dynamic>;
  }
  throw Exception(response.data['message'] ?? 'Failed to load dashboard data');
});
