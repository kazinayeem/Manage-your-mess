import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;

enum Environment { dev, staging, prod }

class EnvConfig {
  static Environment environment = Environment.dev;

  static String get apiBaseUrl {
    // Read from environment variable if defined (e.g. --dart-define=API_URL=...)
    const customUrl = String.fromEnvironment('API_URL');
    if (customUrl.isNotEmpty) {
      return customUrl;
    }

    switch (environment) {
      case Environment.dev:
        if (kIsWeb) {
          return 'http://localhost:5000/api/v1';
        } else if (Platform.isAndroid) {
          return 'http://10.0.2.2:5000/api/v1';
        } else {
          return 'http://127.0.0.1:5000/api/v1';
        }
      case Environment.staging:
        return 'https://staging-api.bornomess.com/api/v1';
      case Environment.prod:
        return 'https://api.bornomess.com/api/v1';
    }
  }

  static const String appName = 'BornoMess Manager';
  static const String appVersion = '1.0.0';
}
