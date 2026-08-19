import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/localization/l10n.dart';
import '../core/providers/global_providers.dart';
import 'router.dart';
import 'theme/app_theme.dart';

class BornoMessApp extends ConsumerWidget {
  const BornoMessApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLocale = ref.watch(localeProvider);
    final currentThemeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'BornoMess Manager',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: currentThemeMode,
      locale: currentLocale,
      localizationsDelegates: const [
        AppL10nDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('bn', 'BD'),
        Locale('en', 'US'),
      ],
      routerConfig: appRouter,
    );
  }
}
