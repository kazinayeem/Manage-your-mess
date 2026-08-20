import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';

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

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Text(l10n.get('members')),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(membersListProvider),
        child: membersAsync.when(
          loading: () => const AppLoadingState(useList: true),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(membersListProvider),
          ),
          data: (members) {
            if (members.isEmpty) {
              return const AppEmptyState(
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

                final badgeVariant = status == 'ACTIVE'
                    ? AppBadgeVariant.success
                    : AppBadgeVariant.warning;

                return AppCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                        ),
                        child: Center(
                          child: Text(
                            name.isNotEmpty ? name[0].toUpperCase() : 'M',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textPrimaryLight,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              email.isEmpty ? role.replaceAll('_', ' ') : '$email · ${role.replaceAll('_', ' ')}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                      AppBadge(text: status, variant: badgeVariant),
                    ],
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