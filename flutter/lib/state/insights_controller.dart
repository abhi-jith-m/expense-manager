import 'package:flutter/foundation.dart';

import '../core/dates.dart';
import '../data/insights_api.dart';
import '../models/models.dart';
import 'auth_controller.dart';
import 'finance_controller.dart';

class InsightsController extends ChangeNotifier {
  InsightsController({InsightsApi? api}) : api = api ?? InsightsApi();

  final InsightsApi api;
  AnalyzeResponse? analysis;
  bool loading = false;
  Object? error;
  DateRange range = defaultMonthRange();
  String? conversationId;
  final messages = <VioChatMessage>[];
  bool chatting = false;
  String? chatError;

  FinanceSnapshotPayload? snapshotFor(AuthController auth, FinanceController finance) {
    final user = auth.user;
    if (user == null) return null;
    return FinanceSnapshotPayload(
      currency: user.currency,
      transactions: finance.transactions,
      categories: finance.categories,
      accounts: finance.accounts,
      budgets: finance.budgets,
      goals: finance.goals,
      recurring: finance.recurring,
    );
  }

  Future<void> analyze(AuthController auth, FinanceController finance, [DateRange? nextRange]) async {
    final session = auth.session;
    final snapshot = snapshotFor(auth, finance);
    if (session == null || snapshot == null) return;
    if (nextRange != null) range = nextRange;
    loading = true;
    error = null;
    notifyListeners();
    try {
      analysis = await api.analyze(
        accessToken: session.accessToken,
        userId: session.user.id,
        startDate: toISODate(range.from),
        endDate: toISODate(range.to),
        snapshot: snapshot,
      );
    } catch (err) {
      error = err;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> sendChat(AuthController auth, FinanceController finance, String message, {String page = 'insights'}) async {
    final session = auth.session;
    final snapshot = snapshotFor(auth, finance);
    if (session == null || snapshot == null || message.trim().isEmpty) return;
    chatting = true;
    chatError = null;
    messages.add(
      VioChatMessage(
        id: 'local-${DateTime.now().millisecondsSinceEpoch}',
        role: 'user',
        content: message.trim(),
        insights: const [],
        metrics: const [],
        relatedTransactions: const [],
        followUps: const [],
        grounding: null,
        createdAt: DateTime.now().toIso8601String(),
      ),
    );
    notifyListeners();
    try {
      final result = await api.chat(
        accessToken: session.accessToken,
        userId: session.user.id,
        message: message.trim(),
        conversationId: conversationId,
        startDate: toISODate(range.from),
        endDate: toISODate(range.to),
        snapshot: snapshot,
        page: page,
      );
      conversationId = result.conversationId;
      messages.add(
        result.message ??
            VioChatMessage(
              id: 'assistant-${DateTime.now().millisecondsSinceEpoch}',
              role: 'assistant',
              content: result.answer,
              insights: result.insights,
              metrics: const [],
              relatedTransactions: const [],
              followUps: const [],
              grounding: null,
              createdAt: DateTime.now().toIso8601String(),
            ),
      );
    } catch (err) {
      chatError = err.toString();
    } finally {
      chatting = false;
      notifyListeners();
    }
  }
}
