import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/providers/global_providers.dart';
import '../../core/errors/app_exception.dart';

// ────────────────────────────────────────────────────────────────────────────
// Dashboard
// ────────────────────────────────────────────────────────────────────────────

final adminDashboardProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/super-admin/overview');
    if (response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>;
    }
    throw Exception(response.data['message'] ?? 'Failed to load dashboard');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Messes
// ────────────────────────────────────────────────────────────────────────────

class AdminMessesParams {
  final int page;
  final String search;
  final String? status;

  const AdminMessesParams(
      {this.page = 1, this.search = '', this.status});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AdminMessesParams &&
          page == other.page &&
          search == other.search &&
          status == other.status;

  @override
  int get hashCode => Object.hash(page, search, status);
}

final adminMessesParamsProvider =
    StateProvider<AdminMessesParams>((ref) => const AdminMessesParams());

final adminMessesProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final params = ref.watch(adminMessesParamsProvider);
  try {
    final dio = ref.read(dioClientProvider).dio;
    final qp = <String, dynamic>{
      'page': params.page,
      'limit': 20,
    };
    if (params.search.isNotEmpty) qp['search'] = params.search;
    if (params.status != null) qp['status'] = params.status;

    final response =
        await dio.get('/super-admin/messes', queryParameters: qp);
    if (response.data['success'] == true) {
      return {
        'data': response.data['data'] as List,
        'meta': response.data['meta'],
      };
    }
    throw Exception('Failed to load messes');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

final adminMessDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
  try {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/super-admin/messes/$id');
    if (response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>;
    }
    throw Exception('Failed to load mess details');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Users
// ────────────────────────────────────────────────────────────────────────────

class AdminUsersParams {
  final int page;
  final String search;
  final String? role;

  const AdminUsersParams({this.page = 1, this.search = '', this.role});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AdminUsersParams &&
          page == other.page &&
          search == other.search &&
          role == other.role;

  @override
  int get hashCode => Object.hash(page, search, role);
}

final adminUsersParamsProvider =
    StateProvider<AdminUsersParams>((ref) => const AdminUsersParams());

final adminUsersProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final params = ref.watch(adminUsersParamsProvider);
  try {
    final dio = ref.read(dioClientProvider).dio;
    final qp = <String, dynamic>{
      'page': params.page,
      'limit': 20,
    };
    if (params.search.isNotEmpty) qp['search'] = params.search;
    if (params.role != null) qp['role'] = params.role;

    final response =
        await dio.get('/super-admin/users', queryParameters: qp);
    if (response.data['success'] == true) {
      return {
        'data': response.data['data'] as List,
        'meta': response.data['meta'],
      };
    }
    throw Exception('Failed to load users');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

final adminUserDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
  try {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/super-admin/users/$id');
    if (response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>;
    }
    throw Exception('Failed to load user details');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Payments
// ────────────────────────────────────────────────────────────────────────────

final adminPaymentsParamsProvider =
    StateProvider<Map<String, dynamic>>((ref) => {'page': 1});

final adminPaymentsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final params = ref.watch(adminPaymentsParamsProvider);
  try {
    final dio = ref.read(dioClientProvider).dio;
    final qp = <String, dynamic>{
      'page': params['page'] ?? 1,
      'limit': 20,
    };
    if (params['status'] != null) qp['status'] = params['status'];

    final response =
        await dio.get('/super-admin/payments', queryParameters: qp);
    if (response.data['success'] == true) {
      return {
        'data': response.data['data'] as List,
        'meta': response.data['meta'],
      };
    }
    throw Exception('Failed to load payments');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Subscriptions
// ────────────────────────────────────────────────────────────────────────────

final adminSubscriptionsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/super-admin/subscriptions');
    if (response.data['success'] == true) {
      return {
        'data': response.data['data'] as List,
        'meta': response.data['meta'],
      };
    }
    throw Exception('Failed to load subscriptions');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────────────────────────────────────

final adminAnalyticsPeriodProvider =
    StateProvider<String>((ref) => 'month');

final adminAnalyticsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final period = ref.watch(adminAnalyticsPeriodProvider);
  try {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/super-admin/analytics',
        queryParameters: {'period': period});
    if (response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>;
    }
    throw Exception('Failed to load analytics');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Audit Logs
// ────────────────────────────────────────────────────────────────────────────

final adminAuditLogsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/super-admin/audit-logs',
        queryParameters: {'limit': 50});
    if (response.data['success'] == true) {
      return {
        'data': response.data['data'] as List,
        'meta': response.data['meta'],
      };
    }
    throw Exception('Failed to load audit logs');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Action Helpers (non-provider, imperative API calls)
// ────────────────────────────────────────────────────────────────────────────

class AdminActions {
  final Dio dio;
  AdminActions(this.dio);

  Future<bool> approveMess(String messId) async {
    final res = await dio.patch('/super-admin/messes/$messId/approve');
    return res.data['success'] == true;
  }

  Future<bool> rejectMess(String messId, {String? reason}) async {
    final res = await dio.patch('/super-admin/messes/$messId/reject',
        data: {'reason': reason});
    return res.data['success'] == true;
  }

  Future<bool> suspendMess(String messId) async {
    final res = await dio.patch('/super-admin/messes/$messId/suspend');
    return res.data['success'] == true;
  }

  Future<bool> activateMess(String messId) async {
    final res = await dio.patch('/super-admin/messes/$messId/activate');
    return res.data['success'] == true;
  }

  Future<bool> changeUserRole(String userId, String role) async {
    final res = await dio.patch('/super-admin/users/$userId/role',
        data: {'role': role});
    return res.data['success'] == true;
  }

  Future<bool> changeUserStatus(String userId,
      {bool? isActive, bool? isLocked}) async {
    final res = await dio.patch('/super-admin/users/$userId/status',
        data: {'isActive': isActive, 'isLocked': isLocked});
    return res.data['success'] == true;
  }

  Future<bool> approvePayment(String paymentId) async {
    final res =
        await dio.patch('/super-admin/payments/$paymentId/approve');
    return res.data['success'] == true;
  }

  Future<bool> rejectPayment(String paymentId, {String? reason}) async {
    final res = await dio.patch(
        '/super-admin/payments/$paymentId/reject',
        data: {'reason': reason});
    return res.data['success'] == true;
  }
}

final adminActionsProvider = Provider<AdminActions>((ref) {
  final dio = ref.read(dioClientProvider).dio;
  return AdminActions(dio);
});
