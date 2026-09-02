import 'package:aureum/data/mappers.dart';
import 'package:aureum/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('camelPatchToRow maps Flutter patches to Supabase columns', () {
    expect(
      camelPatchToRow({
        'fullName': 'Ada',
        'openingBalance': 12.5,
        'categoryId': null,
        'id': 'skip-me',
      }, userId: 'user-1'),
      {
        'user_id': 'user-1',
        'full_name': 'Ada',
        'opening_balance': 12.5,
        'category_id': null,
      },
    );
  });

  test('mapTransaction reads snake_case rows from Supabase', () {
    final tx = mapTransaction({
      'id': 't1',
      'user_id': 'u1',
      'type': 'expense',
      'amount': 10.25,
      'currency': 'INR',
      'category_id': 'c1',
      'subcategory_id': null,
      'account_id': 'a1',
      'to_account_id': null,
      'merchant': 'Cafe',
      'description': '',
      'notes': '',
      'date': '2026-09-02',
      'payment_method': 'upi',
      'tags': ['food'],
      'recurring_id': null,
      'attachment_path': null,
      'attachment_name': null,
      'is_sample': false,
      'created_at': '2026-09-02T00:00:00Z',
      'updated_at': '2026-09-02T00:00:00Z',
    });
    expect(tx.userId, 'u1');
    expect(tx.categoryId, 'c1');
    expect(tx.paymentMethod, PaymentMethod.upi);
    expect(tx.amount, 10.25);
  });

  test('mapProfile merges notification preferences', () {
    final profile = mapProfile({
      'id': 'u1',
      'full_name': 'Ada',
      'avatar_url': null,
      'currency': 'USD',
      'date_format': 'yyyy-MM-dd',
      'theme': 'dark',
      'onboarding_completed': true,
      'notification_preferences': {'budgetAlerts': false},
      'created_at': '2026-01-01T00:00:00Z',
      'updated_at': '2026-01-01T00:00:00Z',
    }, 'ada@example.com');
    expect(profile.email, 'ada@example.com');
    expect(profile.theme, ThemePreference.dark);
    expect(profile.notificationPreferences.budgetAlerts, isFalse);
    expect(profile.notificationPreferences.goalAlerts, isTrue);
  });
}
