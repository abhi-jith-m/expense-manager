import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/env.dart';
import '../models/models.dart';

class FinancialInsight {
  const FinancialInsight({
    required this.id,
    required this.type,
    required this.title,
    required this.summary,
    required this.explanation,
    required this.severity,
    required this.confidence,
    required this.impactScore,
    required this.metrics,
    required this.category,
    required this.relatedTransactionIds,
    required this.recommendation,
    required this.source,
  });

  final String id;
  final String type;
  final String title;
  final String summary;
  final String explanation;
  final String severity;
  final double confidence;
  final double impactScore;
  final Map<String, dynamic> metrics;
  final String? category;
  final List<String> relatedTransactionIds;
  final String? recommendation;
  final String source;

  factory FinancialInsight.fromJson(Map<String, dynamic> json) {
    return FinancialInsight(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'spending',
      title: json['title'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
      severity: json['severity'] as String? ?? 'info',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.8,
      impactScore: (json['impact_score'] as num?)?.toDouble() ?? 0,
      metrics: Map<String, dynamic>.from(json['metrics'] as Map? ?? {}),
      category: json['category'] as String?,
      relatedTransactionIds:
          (json['related_transaction_ids'] as List?)?.map((item) => '$item').toList() ?? const [],
      recommendation: json['recommendation'] as String?,
      source: json['source'] as String? ?? 'deterministic',
    );
  }
}

class AnalyzeResponse {
  const AnalyzeResponse({
    required this.summary,
    required this.financialHealthSummary,
    required this.insights,
    required this.metrics,
    required this.generatedAt,
    required this.usedFallback,
    required this.llmAvailable,
  });

  final String summary;
  final String financialHealthSummary;
  final List<FinancialInsight> insights;
  final Map<String, dynamic> metrics;
  final String generatedAt;
  final bool usedFallback;
  final bool llmAvailable;

  factory AnalyzeResponse.fromJson(Map<String, dynamic> json) {
    return AnalyzeResponse(
      summary: json['summary'] as String? ?? '',
      financialHealthSummary: json['financial_health_summary'] as String? ?? '',
      insights: (json['insights'] as List? ?? [])
          .map((item) => FinancialInsight.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      metrics: Map<String, dynamic>.from(json['metrics'] as Map? ?? {}),
      generatedAt: json['generated_at']?.toString() ?? '',
      usedFallback: json['used_fallback'] as bool? ?? false,
      llmAvailable: json['llm_available'] as bool? ?? false,
    );
  }
}

class ChatMetric {
  const ChatMetric({
    required this.id,
    required this.label,
    required this.value,
    required this.previous,
    required this.change,
    required this.unit,
  });

  final String id;
  final String label;
  final double value;
  final double? previous;
  final double? change;
  final String unit;

  factory ChatMetric.fromJson(Map<String, dynamic> json) {
    return ChatMetric(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      value: (json['value'] as num?)?.toDouble() ?? 0,
      previous: (json['previous'] as num?)?.toDouble(),
      change: (json['change'] as num?)?.toDouble(),
      unit: json['unit'] as String? ?? 'money',
    );
  }
}

class RelatedTransaction {
  const RelatedTransaction({
    required this.id,
    required this.merchant,
    required this.amount,
    required this.date,
    required this.category,
  });

  final String id;
  final String merchant;
  final double amount;
  final String date;
  final String? category;

  factory RelatedTransaction.fromJson(Map<String, dynamic> json) {
    return RelatedTransaction(
      id: json['id'] as String? ?? '',
      merchant: json['merchant'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      date: json['date'] as String? ?? '',
      category: json['category'] as String?,
    );
  }
}

class VioChatMessage {
  const VioChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.insights,
    required this.metrics,
    required this.relatedTransactions,
    required this.followUps,
    required this.grounding,
    required this.createdAt,
  });

  final String id;
  final String role;
  final String content;
  final List<FinancialInsight> insights;
  final List<ChatMetric> metrics;
  final List<RelatedTransaction> relatedTransactions;
  final List<String> followUps;
  final String? grounding;
  final String createdAt;

  factory VioChatMessage.fromJson(Map<String, dynamic> json) {
    return VioChatMessage(
      id: json['id'] as String? ?? '',
      role: json['role'] as String? ?? 'assistant',
      content: json['content'] as String? ?? '',
      insights: (json['insights'] as List? ?? [])
          .map((item) => FinancialInsight.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      metrics: (json['metrics'] as List? ?? [])
          .map((item) => ChatMetric.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      relatedTransactions: (json['related_transactions'] as List? ?? [])
          .map((item) => RelatedTransaction.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      followUps: (json['follow_ups'] as List?)?.map((item) => '$item').toList() ?? const [],
      grounding: json['grounding'] as String?,
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}

class ChatResponse {
  const ChatResponse({
    required this.conversationId,
    required this.answer,
    required this.message,
    required this.insights,
    required this.usedFallback,
    required this.emptyData,
  });

  final String conversationId;
  final String answer;
  final VioChatMessage? message;
  final List<FinancialInsight> insights;
  final bool usedFallback;
  final bool emptyData;

  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    return ChatResponse(
      conversationId: json['conversation_id'] as String? ?? '',
      answer: json['answer'] as String? ?? '',
      message: json['message'] is Map
          ? VioChatMessage.fromJson(Map<String, dynamic>.from(json['message'] as Map))
          : null,
      insights: (json['insights'] as List? ?? [])
          .map((item) => FinancialInsight.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      usedFallback: json['used_fallback'] as bool? ?? false,
      emptyData: json['empty_data'] as bool? ?? false,
    );
  }
}

class FinanceSnapshotPayload {
  const FinanceSnapshotPayload({
    required this.currency,
    required this.transactions,
    required this.categories,
    required this.accounts,
    required this.budgets,
    required this.goals,
    required this.recurring,
  });

  final String currency;
  final List<Transaction> transactions;
  final List<Category> categories;
  final List<Account> accounts;
  final List<Budget> budgets;
  final List<Goal> goals;
  final List<RecurringTransaction> recurring;

  String get dataVersion {
    final stamps = [
      ...transactions.map((item) => item.updatedAt),
      ...budgets.map((item) => item.updatedAt),
      ...accounts.map((item) => item.updatedAt),
      ...goals.map((item) => item.updatedAt),
    ]..sort();
    return '${stamps.isEmpty ? 'empty' : stamps.last}:${transactions.length}';
  }

  Map<String, dynamic> toJson() => {
        'currency': currency,
        'transactions': transactions.map((item) => item.toJson()).toList(),
        'categories': categories.map((item) => item.toJson()).toList(),
        'accounts': accounts.map((item) => item.toJson()).toList(),
        'budgets': budgets.map((item) => item.toJson()).toList(),
        'goals': goals.map((item) => item.toJson()).toList(),
        'recurring': recurring.map((item) => item.toJson()).toList(),
      };
}

class InsightsApi {
  InsightsApi({http.Client? httpClient, String? baseUrl})
      : _http = httpClient ?? http.Client(),
        baseUrl = (baseUrl ?? AppEnv.current.insightsApiUrl).replaceAll(RegExp(r'/$'), '');

  final http.Client _http;
  final String baseUrl;

  Map<String, String> _headers(String accessToken, String userId) => {
        'Authorization': 'Bearer $accessToken',
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      };

  Future<AnalyzeResponse> analyze({
    required String accessToken,
    required String userId,
    required String startDate,
    required String endDate,
    required FinanceSnapshotPayload snapshot,
  }) async {
    final response = await _http.post(
      Uri.parse('$baseUrl/insights/analyze'),
      headers: _headers(accessToken, userId),
      body: jsonEncode({
        'start_date': startDate,
        'end_date': endDate,
        'snapshot': snapshot.toJson(),
        'data_version': snapshot.dataVersion,
        'currency': snapshot.currency,
      }),
    );
    if (response.statusCode >= 400) throw Exception(await _error(response));
    return AnalyzeResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<ChatResponse> chat({
    required String accessToken,
    required String userId,
    required String message,
    required String startDate,
    required String endDate,
    required FinanceSnapshotPayload snapshot,
    String? conversationId,
    String? page,
  }) async {
    final response = await _http.post(
      Uri.parse('$baseUrl/insights/chat'),
      headers: _headers(accessToken, userId),
      body: jsonEncode({
        'message': message,
        'conversation_id': conversationId,
        'start_date': startDate,
        'end_date': endDate,
        'snapshot': snapshot.toJson(),
        'page': page,
      }),
    );
    if (response.statusCode >= 400) throw Exception(await _error(response));
    return ChatResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<String> _error(http.Response response) async {
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return body['detail']?.toString() ?? 'Insights request failed (${response.statusCode})';
    } catch (_) {
      return 'Insights request failed (${response.statusCode})';
    }
  }
}
