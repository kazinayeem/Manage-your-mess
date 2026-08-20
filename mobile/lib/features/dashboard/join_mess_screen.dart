import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../app/theme/app_colors.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_text_field.dart';
import '../auth/auth_provider.dart';

class JoinMessScreen extends ConsumerStatefulWidget {
  const JoinMessScreen({super.key});

  @override
  ConsumerState<JoinMessScreen> createState() => _JoinMessScreenState();
}

class _JoinMessScreenState extends ConsumerState<JoinMessScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _onJoin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final dio = ref.read(dioClientProvider).dio;
      final response = await dio.post('/messes/join', data: {
        'inviteCode': _codeController.text.trim(),
      });

      if (response.data['success'] == true) {
        await ref.read(authProvider.notifier).checkAuthStatus();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Join request sent. Waiting for approval.'),
              backgroundColor: AppColors.warning,
            ),
          );
          context.go('/home');
        }
      } else {
        setState(() {
          _error = response.data['message'] ?? 'Invalid invite code';
        });
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString();
      setState(() => _error = msg ?? 'Failed to join mess. Please try again.');
    } catch (e) {
      setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const Text('Join Mess'),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: AppCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Join an existing mess',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryLight,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Ask your mess manager for the invite code.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 20),
                if (_error != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.errorSoft,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(
                        color: AppColors.errorText,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                AppTextField(
                  label: 'Invite Code',
                  hint: 'Enter invite code',
                  controller: _codeController,
                  prefixIcon: Icons.key_outlined,
                  textCapitalization: TextCapitalization.characters,
                  required: true,
                  validator: (val) =>
                      val == null || val.trim().isEmpty ? 'Invite code is required' : null,
                ),
                const SizedBox(height: 24),
                AppButton(
                  text: 'Join Mess',
                  icon: Icons.group_add_outlined,
                  isLoading: _isSubmitting,
                  onPressed: _onJoin,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}