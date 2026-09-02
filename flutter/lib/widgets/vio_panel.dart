import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/vio_prompts.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../state/insights_controller.dart';

class VioChatView extends StatefulWidget {
  const VioChatView({super.key, this.page = 'insights', this.initialPrompt});

  final String page;
  final String? initialPrompt;

  @override
  State<VioChatView> createState() => _VioChatViewState();
}

class _VioChatViewState extends State<VioChatView> {
  final controller = TextEditingController();
  final scroll = ScrollController();
  var sentInitial = false;

  @override
  void initState() {
    super.initState();
    final prompt = widget.initialPrompt;
    if (prompt != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (sentInitial || !mounted) return;
        sentInitial = true;
        _send(prompt);
      });
    }
  }

  @override
  void dispose() {
    controller.dispose();
    scroll.dispose();
    super.dispose();
  }

  Future<void> _send(String message) async {
    controller.clear();
    await context.read<InsightsController>().sendChat(
          context.read<AuthController>(),
          context.read<FinanceController>(),
          message,
          page: widget.page,
        );
    if (!mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!scroll.hasClients) return;
      scroll.animateTo(scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  @override
  Widget build(BuildContext context) {
    final insights = context.watch<InsightsController>();
    final suggestions = vioSuggestions(widget.page);
    return Column(
      children: [
        Expanded(
          child: ListView(
            controller: scroll,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            children: [
              Text('Your personal finance copilot', style: Theme.of(context).textTheme.bodySmall),
              if (insights.messages.isEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final prompt in suggestions)
                      ActionChip(label: Text(prompt), onPressed: insights.chatting ? null : () => _send(prompt)),
                  ],
                ),
              ],
              for (final message in insights.messages)
                Align(
                  alignment: message.role == 'user' ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(top: 10),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.82),
                    decoration: BoxDecoration(
                      color: message.role == 'user'
                          ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.12)
                          : Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(message.content),
                        for (final follow in message.followUps)
                          TextButton(onPressed: () => _send(follow), child: Text(follow)),
                      ],
                    ),
                  ),
                ),
              if (insights.chatting)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text('Analyzing your spending…', style: Theme.of(context).textTheme.bodySmall),
                ),
              if (insights.chatError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    insights.chatError!.contains('Network') || insights.chatError!.contains('origin')
                        ? 'AI insights will be available when you are back online.'
                        : insights.chatError!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ),
            ],
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    enabled: !insights.chatting,
                    textInputAction: TextInputAction.send,
                    decoration: const InputDecoration(hintText: 'Ask about this period'),
                    onSubmitted: insights.chatting ? null : _send,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: insights.chatting ? null : () => _send(controller.text),
                  icon: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

Future<void> openVioSheet(BuildContext context, {String page = 'dashboard', String? prompt}) {
  final tall = MediaQuery.sizeOf(context).height;
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: SizedBox(
          height: tall * 0.92,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 8, 0),
                child: Row(
                  children: [
                    Icon(Icons.auto_awesome, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 8),
                    Expanded(child: Text('Vio', style: Theme.of(context).textTheme.titleLarge)),
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(child: VioChatView(page: page, initialPrompt: prompt)),
            ],
          ),
        ),
      );
    },
  );
}
