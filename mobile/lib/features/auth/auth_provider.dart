import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/global_providers.dart';
import '../../core/errors/app_exception.dart';
import 'package:dio/dio.dart';

enum AuthStatus { initial, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final Map<String, dynamic>? user;
  final List<dynamic> messes;
  final String? activeMessId;
  final String? errorMessage;
  final bool isLoading;

  AuthState({
    required this.status,
    this.user,
    this.messes = const [],
    this.activeMessId,
    this.errorMessage,
    this.isLoading = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    Map<String, dynamic>? user,
    List<dynamic>? messes,
    String? activeMessId,
    String? errorMessage,
    bool? isLoading,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      messes: messes ?? this.messes,
      activeMessId: activeMessId ?? this.activeMessId,
      errorMessage: errorMessage,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref ref;

  AuthNotifier(this.ref)
      : super(AuthState(status: AuthStatus.initial)) {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.getAccessToken();

    if (token == null || token.isEmpty) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return;
    }

    try {
      final dio = ref.read(dioClientProvider).dio;
      final response = await dio.get('/auth/me');

      if (response.data['success'] == true) {
        final userData = response.data['data']['user'];
        final messes = response.data['data']['messes'] as List;
        final savedMessId = await storage.getActiveMessId();

        String? activeMessId = savedMessId;
        if ((activeMessId == null || activeMessId.isEmpty) && messes.isNotEmpty) {
          activeMessId = messes.first['id'];
          await storage.saveActiveMessId(activeMessId!);
        }

        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: userData,
          messes: messes,
          activeMessId: activeMessId,
        );
      } else {
        await storage.clearAll();
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      await storage.clearAll();
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final dio = ref.read(dioClientProvider).dio;
      final storage = ref.read(secureStorageProvider);

      final response = await dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'];
        await storage.saveAccessToken(data['accessToken']);
        await storage.saveRefreshToken(data['refreshToken']);

        final messes = data['messes'] as List;
        String? messId;
        if (messes.isNotEmpty) {
          messId = messes.first['id'];
          await storage.saveActiveMessId(messId!);
        }

        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: data['user'],
          messes: messes,
          activeMessId: messId,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['message'] ?? 'Login failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final appEx = AppException.fromDioError(e);
      state = state.copyWith(isLoading: false, errorMessage: appEx.message);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<bool> register(String name, String email, String password, String phone) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final dio = ref.read(dioClientProvider).dio;
      final storage = ref.read(secureStorageProvider);

      final response = await dio.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'phone': phone,
      });

      if (response.data['success'] == true) {
        final data = response.data['data'];
        await storage.saveAccessToken(data['accessToken']);
        await storage.saveRefreshToken(data['refreshToken']);

        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: data['user'],
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['message'] ?? 'Registration failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final appEx = AppException.fromDioError(e);
      state = state.copyWith(isLoading: false, errorMessage: appEx.message);
      return false;
    }
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageProvider);
    try {
      final dio = ref.read(dioClientProvider).dio;
      await dio.post('/auth/logout');
    } catch (_) {}
    await storage.clearAll();
    state = AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
