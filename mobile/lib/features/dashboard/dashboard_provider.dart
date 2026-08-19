import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/global_providers.dart';
import '../auth/auth_provider.dart';

final dashboardAnalyticsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final authState = ref.watch(authProvider);
  final activeMessId = authState.activeMessId ??
      (authState.messes.isNotEmpty ? authState.messes.first['id']?.toString() : null);

  if (activeMessId == null) {
    return {
      'totalMembers': 0,
      'totalExpense': 0.0,
      'totalDeposit': 0.0,
      'totalMeals': 0,
      'mealRate': 0.0,
      'totalDues': 0.0,
      'recentExpenses': [],
    };
  }

  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/analytics/dashboard', queryParameters: {
    'messId': activeMessId,
  });

  if (response.data['success'] == true) {
    return response.data['data'] as Map<String, dynamic>;
  }
  throw Exception(response.data['message'] ?? 'Failed to load dashboard data');
});
