enum Environment { dev, staging, prod }

class EnvConfig {
  static Environment environment = Environment.dev;

  static String get apiBaseUrl {
    switch (environment) {
      case Environment.dev:
        // Android Emulator: 10.0.2.2:5000, iOS / Desktop: localhost:5000
        return 'http://10.0.2.2:5000/api/v1';
      case Environment.staging:
        return 'https://staging-api.bornomess.com/api/v1';
      case Environment.prod:
        return 'https://api.bornomess.com/api/v1';
    }
  }

  static const String appName = 'BornoMess Manager';
  static const String appVersion = '1.0.0';
}
