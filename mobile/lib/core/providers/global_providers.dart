import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';
import '../network/dio_client.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final dioClientProvider = Provider<DioClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return DioClient(storage);
});

final localeProvider = StateProvider<Locale>((ref) {
  return const Locale('bn'); // Default Bangla
});

final themeModeProvider = StateProvider<ThemeMode>((ref) {
  return ThemeMode.system;
});
