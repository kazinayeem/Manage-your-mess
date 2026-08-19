import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _activeMessIdKey = 'active_mess_id';

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  Future<void> saveActiveMessId(String messId) async {
    await _storage.write(key: _activeMessIdKey, value: messId);
  }

  Future<String?> getActiveMessId() async {
    return await _storage.read(key: _activeMessIdKey);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
