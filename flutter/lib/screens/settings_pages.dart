import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../core/appearance.dart';
import '../core/currency.dart';
import '../core/dates.dart';
import '../core/errors.dart';
import '../core/import_export.dart';
import '../core/palette.dart';
import '../core/seed.dart';
import '../data/client.dart';
import '../models/models.dart';
import '../state/appearance_controller.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final password = TextEditingController();

  @override
  void dispose() {
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    final user = auth.user;
    if (user == null) return const SizedBox.shrink();

    Future<void> patch(Map<String, dynamic> update) async {
      await auth.client.updateProfile(update);
      await auth.refresh();
      if (context.mounted) showSnack(context, 'Saved');
    }

    return PageStack(
      children: [
        const PageHeader(title: 'Settings', description: 'Appearance, currency, notifications, and account security.'),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              ListTile(
                title: const Text('Profile'),
                subtitle: Text(user.email),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/profile'),
              ),
              const Divider(height: 1),
              ListTile(
                title: const Text('Currency'),
                trailing: DropdownButton<String>(
                  value: user.currency,
                  items: [for (final item in currencies) DropdownMenuItem(value: item.code, child: Text(item.code))],
                  onChanged: (value) {
                    if (value != null) patch({'currency': value});
                  },
                ),
              ),
              ListTile(
                title: const Text('Date format'),
                trailing: DropdownButton<String>(
                  value: user.dateFormat,
                  items: [for (final item in dateFormats) DropdownMenuItem(value: item.value, child: Text(item.label))],
                  onChanged: (value) {
                    if (value != null) patch({'dateFormat': value});
                  },
                ),
              ),
            ],
          ),
        ),
        const AppearancePanel(),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (final entry in [
                ('budgetAlerts', 'Budget alerts', user.notificationPreferences.budgetAlerts),
                ('recurringAlerts', 'Recurring due dates', user.notificationPreferences.recurringAlerts),
                ('goalAlerts', 'Goal milestones', user.notificationPreferences.goalAlerts),
                ('importExportAlerts', 'Import and export', user.notificationPreferences.importExportAlerts),
              ])
                SwitchListTile(
                  title: Text(entry.$2),
                  value: entry.$3,
                  onChanged: (checked) {
                    final prefs = user.notificationPreferences.toJson();
                    prefs[entry.$1] = checked;
                    patch({'notificationPreferences': prefs});
                  },
                ),
            ],
          ),
        ),
        ExpansionTile(
          title: const Text('Security'),
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'New password')),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: () async {
                      try {
                        await auth.client.updatePassword(password.text);
                        password.clear();
                        if (context.mounted) showSnack(context, 'Password updated');
                      } catch (error) {
                        if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                      }
                    },
                    child: const Text('Change password'),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () async {
                      await auth.signOut();
                      if (context.mounted) context.go('/login');
                    },
                    child: const Text('Log out'),
                  ),
                ],
              ),
            ),
          ],
        ),
        ExpansionTile(
          title: const Text('Data'),
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  OutlinedButton(
                    onPressed: () async {
                      final payload = await auth.client.exportAll();
                      await SharePlus.instance.share(
                        ShareParams(files: [XFile.fromData(Uint8List.fromList(utf8.encode(const JsonEncoder.withIndent('  ').convert(payload))), mimeType: 'application/json', name: exportFilename('workspace', 'json'))]),
                      );
                      if (context.mounted) showSnack(context, 'Workspace exported');
                    },
                    child: const Text('Export all data'),
                  ),
                  OutlinedButton(onPressed: () => context.go('/import-export'), child: const Text('Import data')),
                  OutlinedButton(
                    onPressed: () async {
                      final seed = buildSampleData(user.id, user.currency);
                      for (final account in seed.accounts) {
                        await auth.client.createAccount({
                          'name': account.name,
                          'type': account.type.value,
                          'openingBalance': account.openingBalance,
                          'currency': account.currency,
                          'icon': account.icon,
                          'color': account.color,
                          'status': account.status.value,
                        });
                      }
                      final createdAccounts = await auth.client.listAccounts();
                      final txs = seed.transactionsFor(finance.categories);
                      for (var index = 0; index < txs.length; index++) {
                        final tx = txs[index];
                        await auth.client.createTransaction(
                          CreateTransactionInput(
                            type: tx.type,
                            amount: tx.amount,
                            currency: tx.currency,
                            categoryId: tx.categoryId,
                            subcategoryId: tx.subcategoryId,
                            accountId: createdAccounts[index % createdAccounts.length].id,
                            toAccountId: tx.toAccountId,
                            merchant: tx.merchant,
                            description: tx.description,
                            notes: tx.notes,
                            date: tx.date,
                            paymentMethod: tx.paymentMethod,
                            tags: tx.tags,
                            recurringId: null,
                            attachmentPath: null,
                            attachmentName: null,
                            isSample: true,
                          ),
                        );
                      }
                      for (final budget in seed.budgets(finance.categories)) {
                        await auth.client.createBudget({
                          'name': budget.name,
                          'categoryId': budget.categoryId,
                          'limitAmount': budget.limitAmount,
                          'period': budget.period.value,
                          'startDate': budget.startDate,
                          'endDate': budget.endDate,
                          'alertThreshold': budget.alertThreshold,
                        });
                      }
                      for (final goal in seed.goals) {
                        await auth.client.createGoal({
                          'name': goal.name,
                          'targetAmount': goal.targetAmount,
                          'currentAmount': goal.currentAmount,
                          'deadline': goal.deadline,
                          'icon': goal.icon,
                          'color': goal.color,
                        });
                      }
                      await finance.refresh();
                      if (context.mounted) showSnack(context, 'Sample data added. It is marked as sample.');
                    },
                    child: const Text('Try sample data'),
                  ),
                  OutlinedButton(
                    onPressed: () async {
                      final all = await auth.client.listTransactions();
                      final sampleIds = all.where((tx) => tx.isSample).map((tx) => tx.id).toList();
                      if (sampleIds.isNotEmpty) await auth.client.deleteTransactions(sampleIds);
                      await finance.refresh();
                      if (context.mounted) {
                        showSnack(context, sampleIds.isEmpty ? 'No sample transactions found' : 'Sample transactions removed');
                      }
                    },
                    child: const Text('Remove sample data'),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
                    onPressed: () async {
                      final confirmed = await ConfirmDialog.show(
                        context,
                        title: 'Delete your account?',
                        description: 'This permanently removes your financial data from this workspace.',
                        confirmLabel: 'Delete account',
                        destructive: true,
                      );
                      if (!confirmed) return;
                      await auth.client.deleteAccount();
                      if (context.mounted) context.go('/signup');
                    },
                    child: const Text('Delete account'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class AppearancePanel extends StatelessWidget {
  const AppearancePanel({super.key});

  @override
  Widget build(BuildContext context) {
    final appearance = context.watch<AppearanceController>();
    final value = appearance.appearance;
    final userId = context.watch<AuthController>().user?.id;

    Future<void> set(AppearancePreferences next) => appearance.update(next, userId);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Appearance', style: TextStyle(fontWeight: FontWeight.w600)),
          Text('Theme, type, and spacing. Changes apply immediately.', style: TextStyle(color: context.aureum.label, fontSize: 12)),
          const SizedBox(height: 12),
          const FieldLabel('Theme'),
          ChoiceChips<String>(
            value: value.theme,
            options: const [('system', 'System'), ('light', 'Light'), ('dark', 'Dark')],
            onChanged: (theme) => set(value.copyWith(theme: theme)),
          ),
          const SizedBox(height: 12),
          const FieldLabel('Preset'),
          Wrap(
            spacing: 8,
            children: [
              for (final preset in presets)
                ChoiceChip(
                  label: Text(preset.label),
                  selected: value.preset == preset.id,
                  onSelected: (_) => set(value.copyWith(preset: preset.id, accent: preset.accent)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const FieldLabel('Accent'),
          Wrap(
            spacing: 8,
            children: [
              for (final accent in accents)
                GestureDetector(
                  onTap: () => set(value.copyWith(accent: accent)),
                  child: CircleAvatar(
                    radius: 12,
                    backgroundColor: accentSwatch[accent],
                    child: value.accent == accent ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const FieldLabel('Density'),
          ChoiceChips<String>(
            value: value.density,
            options: const [('compact', 'Compact'), ('comfortable', 'Comfortable'), ('spacious', 'Spacious')],
            onChanged: (density) => set(value.copyWith(density: density)),
          ),
          const SizedBox(height: 12),
          const FieldLabel('Text size'),
          ChoiceChips<String>(
            value: value.textSize,
            options: const [('small', 'Small'), ('default', 'Default'), ('large', 'Large')],
            onChanged: (textSize) => set(value.copyWith(textSize: textSize)),
          ),
          const SizedBox(height: 12),
          const FieldLabel('Typography'),
          ChoiceChips<String>(
            value: value.typography,
            options: const [('modern', 'Modern'), ('system', 'System'), ('data', 'Data')],
            onChanged: (typography) => set(value.copyWith(typography: typography)),
          ),
          const SizedBox(height: 12),
          const FieldLabel('Corners'),
          ChoiceChips<String>(
            value: value.cornerStyle,
            options: const [('soft', 'Soft'), ('rounded', 'Rounded'), ('sharp', 'Sharp')],
            onChanged: (cornerStyle) => set(value.copyWith(cornerStyle: cornerStyle)),
          ),
          const SizedBox(height: 12),
          const FieldLabel('Motion'),
          ChoiceChips<String>(
            value: value.motion,
            options: const [('full', 'Full'), ('reduced', 'Reduced')],
            onChanged: (motion) => set(value.copyWith(motion: motion)),
          ),
        ],
      ),
    );
  }
}

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late final TextEditingController name;

  @override
  void initState() {
    super.initState();
    name = TextEditingController(text: context.read<AuthController>().user?.fullName ?? '');
  }

  @override
  void dispose() {
    name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;
    if (user == null) return const SizedBox.shrink();
    return PageStack(
      children: [
        const PageHeader(title: 'Profile', description: 'Your name and avatar appear across the workspace.'),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundImage: user.avatarUrl == null ? null : MemoryImage(_decodeDataUrl(user.avatarUrl!)),
                    child: user.avatarUrl == null ? Text(user.fullName.isEmpty ? '?' : user.fullName.substring(0, user.fullName.length.clamp(0, 2)).toUpperCase()) : null,
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextButton(
                        onPressed: () async {
                          final file = await FilePicker.pickFile(type: FileType.image);
                          if (file == null) return;
                          try {
                            final bytes = await file.readAsBytes();
                            await auth.client.uploadAvatar(
                              ReceiptFile(bytes: bytes, name: file.name, mimeType: file.extension == 'png' ? 'image/png' : 'image/jpeg'),
                            );
                            await auth.refresh();
                            if (context.mounted) showSnack(context, 'Avatar updated');
                          } catch (error) {
                            if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                          }
                        },
                        child: const Text('Change photo'),
                      ),
                      Text(user.email, style: TextStyle(fontSize: 12, color: context.aureum.label)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () async {
                  await auth.client.updateProfile({'fullName': name.text});
                  await auth.refresh();
                  if (context.mounted) showSnack(context, 'Profile saved');
                },
                child: const Text('Save profile'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

Uint8List _decodeDataUrl(String dataUrl) {
  final comma = dataUrl.indexOf(',');
  return base64Decode(comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl);
}
