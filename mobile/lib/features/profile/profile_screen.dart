import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../auth/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final authState = ref.watch(authProvider);
    final currentLocale = ref.watch(localeProvider);
    final currentTheme = ref.watch(themeModeProvider);
    final theme = Theme.of(context);

    final user = authState.user;
    final name = user?['name'] ?? 'User';
    final email = user?['email'] ?? '';
    final role = user?['role'] ?? 'MEMBER';

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('profile')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // User Info Header
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: theme.primaryColor.withOpacity(0.15),
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : 'U',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: theme.primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(email, style: theme.textTheme.bodySmall),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: theme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              role,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: theme.primaryColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Settings Options
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.language_rounded),
                    title: Text(l10n.get('language')),
                    subtitle: Text(currentLocale.languageCode == 'bn' ? 'বাংলা (Bangla)' : 'English'),
                    trailing: DropdownButton<String>(
                      value: currentLocale.languageCode,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(value: 'bn', child: Text('বাংলা')),
                        DropdownMenuItem(value: 'en', child: Text('English')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          ref.read(localeProvider.notifier).state = Locale(val);
                        }
                      },
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.dark_mode_outlined),
                    title: Text(l10n.get('theme')),
                    subtitle: Text(currentTheme.name.toUpperCase()),
                    trailing: Switch(
                      value: currentTheme == ThemeMode.dark,
                      onChanged: (isDark) {
                        ref.read(themeModeProvider.notifier).state =
                            isDark ? ThemeMode.dark : ThemeMode.light;
                      },
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.shield_outlined),
                    title: const Text('Security'),
                    subtitle: const Text('Password & authentication'),
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            Card(
              child: ListTile(
                leading: const Icon(Icons.logout, color: Colors.redAccent),
                title: Text(
                  l10n.get('logout'),
                  style: const TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
