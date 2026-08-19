import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/shimmer_loader.dart';
import 'admin_provider.dart';

class AdminUsersScreen extends ConsumerStatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  ConsumerState<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends ConsumerState<AdminUsersScreen> {
  final _searchController = TextEditingController();
  String? _selectedRole;

  static const _roleFilters = [
    null,
    'SUPER_ADMIN',
    'MESS_OWNER',
    'MESS_MANAGER',
    'MEMBER',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _updateFilter() {
    ref.read(adminUsersParamsProvider.notifier).state = AdminUsersParams(
      search: _searchController.text.trim(),
      role: _selectedRole,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final usersAsync = ref.watch(adminUsersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('User Management')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search users...',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _updateFilter();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onSubmitted: (_) => _updateFilter(),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: _roleFilters.map((role) {
                final isSelected = _selectedRole == role;
                final label = role?.replaceAll('_', ' ') ?? 'All';
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    selected: isSelected,
                    label: Text(label),
                    onSelected: (_) {
                      setState(() => _selectedRole = role);
                      _updateFilter();
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(adminUsersProvider),
              child: usersAsync.when(
                loading: () => const DashboardSkeleton(),
                error: (err, _) => ErrorView(
                  message: err.toString(),
                  onRetry: () => ref.invalidate(adminUsersProvider),
                ),
                data: (result) {
                  final users = (result['data'] as List?) ?? [];

                  if (users.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.people_outline,
                              size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('No users found'),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: users.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 6),
                    itemBuilder: (context, index) {
                      final user = users[index];
                      final role = user['role'] ?? 'MEMBER';
                      final isActive = user['isActive'] ?? true;
                      final isLocked = user['isLocked'] ?? false;
                      final messCount = user['_count']?['members'] ?? 0;

                      return Card(
                        child: ListTile(
                          onTap: () =>
                              context.push('/admin/users/${user['id']}'),
                          leading: CircleAvatar(
                            backgroundColor:
                                AppColors.primary.withOpacity(0.12),
                            child: Text(
                              (user['name'] ?? 'U')
                                  .toString()
                                  .substring(0, 1)
                                  .toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  user['name'] ?? 'Unknown',
                                  style: theme.textTheme.titleSmall,
                                ),
                              ),
                              if (!isActive || isLocked)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.error.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    isLocked ? 'LOCKED' : 'INACTIVE',
                                    style: const TextStyle(
                                      color: AppColors.error,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          subtitle: Text(
                            '${user['email'] ?? ''} • $messCount messes',
                          ),
                          trailing: _RoleBadge(role: role),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    Color c;
    switch (role) {
      case 'SUPER_ADMIN':
        c = const Color(0xFFEF4444);
        break;
      case 'ADMIN':
        c = const Color(0xFFF59E0B);
        break;
      case 'MESS_OWNER':
        c = const Color(0xFF4338CA);
        break;
      case 'MESS_MANAGER':
        c = const Color(0xFF0F766E);
        break;
      default:
        c = const Color(0xFF64748B);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        role.replaceAll('_', ' '),
        style: TextStyle(
            color: c, fontSize: 9, fontWeight: FontWeight.w600),
      ),
    );
  }
}
