import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/empty_view.dart';
import '../../core/widgets/error_view.dart';

final membersListProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/members');
  if (response.data['success'] == true) {
    return (response.data['data'] as List?) ?? [];
  }
  throw Exception(response.data['message'] ?? 'Failed to load members');
});

class MemberListScreen extends ConsumerWidget {
  const MemberListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final membersAsync = ref.watch(membersListProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('members')),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(membersListProvider),
        child: membersAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(membersListProvider),
          ),
          data: (members) {
            if (members.isEmpty) {
              return const EmptyView(
                title: 'No Members Registered',
                subtitle: 'Invite members using your Mess invite code',
                icon: Icons.people_outline,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: members.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = members[index];
                final name = item['user']?['name'] ?? 'Member';
                final email = item['user']?['email'] ?? '';
                final role = item['role'] ?? 'MEMBER';
                final status = item['status'] ?? 'ACTIVE';

                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: theme.primaryColor.withOpacity(0.12),
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : 'M',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: theme.primaryColor,
                        ),
                      ),
                    ),
                    title: Text(name, style: theme.textTheme.titleSmall),
                    subtitle: Text('$email • Role: $role'),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: status == 'ACTIVE'
                            ? Colors.green.withOpacity(0.12)
                            : Colors.orange.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: status == 'ACTIVE' ? Colors.green : Colors.orange,
                        ),
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
