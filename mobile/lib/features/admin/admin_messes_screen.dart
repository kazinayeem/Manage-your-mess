import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/shimmer_loader.dart';
import 'admin_provider.dart';

class AdminMessesScreen extends ConsumerStatefulWidget {
  const AdminMessesScreen({super.key});

  @override
  ConsumerState<AdminMessesScreen> createState() => _AdminMessesScreenState();
}

class _AdminMessesScreenState extends ConsumerState<AdminMessesScreen> {
  final _searchController = TextEditingController();
  String? _selectedStatus;

  static const _statusFilters = [
    null,
    'ACTIVE',
    'PENDING',
    'SUSPENDED',
    'REJECTED',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _updateFilter() {
    ref.read(adminMessesParamsProvider.notifier).state = AdminMessesParams(
      search: _searchController.text.trim(),
      status: _selectedStatus,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final messesAsync = ref.watch(adminMessesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mess Management'),
      ),
      body: Column(
        children: [
          // Search + Filter
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search messes...',
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
          // Status Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: _statusFilters.map((status) {
                final isSelected = _selectedStatus == status;
                final label = status ?? 'All';
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    selected: isSelected,
                    label: Text(label),
                    onSelected: (_) {
                      setState(() => _selectedStatus = status);
                      _updateFilter();
                    },
                    selectedColor:
                        _getStatusColor(status).withOpacity(0.2),
                    checkmarkColor: _getStatusColor(status),
                    labelStyle: TextStyle(
                      color: isSelected
                          ? _getStatusColor(status)
                          : null,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async =>
                  ref.invalidate(adminMessesProvider),
              child: messesAsync.when(
                loading: () => const DashboardSkeleton(),
                error: (err, _) => ErrorView(
                  message: err.toString(),
                  onRetry: () =>
                      ref.invalidate(adminMessesProvider),
                ),
                data: (result) {
                  final messes = (result['data'] as List?) ?? [];
                  final meta = result['meta'] as Map?;

                  if (messes.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.home_work_outlined,
                              size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('No messes found'),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: messes.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final mess = messes[index];
                      final owner = mess['owner'];
                      final memberCount =
                          mess['_count']?['members'] ?? 0;
                      final sub = mess['subscription'];
                      final plan = sub?['plan'];

                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => context.push(
                              '/admin/messes/${mess['id']}'),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        mess['name'] ?? 'Unnamed',
                                        style: theme
                                            .textTheme.titleSmall
                                            ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    _MessStatusBadge(
                                        status:
                                            mess['status'] ?? 'ACTIVE'),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Owner: ${owner?['name'] ?? '-'} • ${owner?['email'] ?? ''}',
                                  style: theme.textTheme.bodySmall,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(Icons.people_outline,
                                        size: 14,
                                        color: theme
                                            .textTheme.bodySmall?.color),
                                    const SizedBox(width: 4),
                                    Text('$memberCount members',
                                        style:
                                            theme.textTheme.bodySmall),
                                    if (plan != null) ...[
                                      const SizedBox(width: 16),
                                      Icon(Icons.card_membership,
                                          size: 14,
                                          color: theme.textTheme
                                              .bodySmall?.color),
                                      const SizedBox(width: 4),
                                      Text(plan['name'] ?? '',
                                          style: theme
                                              .textTheme.bodySmall),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
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

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'ACTIVE':
        return const Color(0xFF10B981);
      case 'PENDING':
        return const Color(0xFFF59E0B);
      case 'SUSPENDED':
        return const Color(0xFFEF4444);
      case 'REJECTED':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF4338CA);
    }
  }
}

class _MessStatusBadge extends StatelessWidget {
  final String status;
  const _MessStatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color badgeColor;
    switch (status) {
      case 'ACTIVE':
        badgeColor = const Color(0xFF10B981);
        break;
      case 'PENDING':
        badgeColor = const Color(0xFFF59E0B);
        break;
      case 'SUSPENDED':
        badgeColor = const Color(0xFFEF4444);
        break;
      case 'REJECTED':
        badgeColor = const Color(0xFF64748B);
        break;
      default:
        badgeColor = const Color(0xFF94A3B8);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: badgeColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
