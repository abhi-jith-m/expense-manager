class CurrencyMeta {
  const CurrencyMeta({
    required this.code,
    required this.symbol,
    required this.name,
    required this.decimals,
  });

  final String code;
  final String symbol;
  final String name;
  final int decimals;
}

const currencies = [
  CurrencyMeta(code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2),
  CurrencyMeta(code: 'USD', symbol: r'$', name: 'US Dollar', decimals: 2),
  CurrencyMeta(code: 'EUR', symbol: '€', name: 'Euro', decimals: 2),
  CurrencyMeta(code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2),
  CurrencyMeta(code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2),
  CurrencyMeta(code: 'AUD', symbol: r'A$', name: 'Australian Dollar', decimals: 2),
  CurrencyMeta(code: 'CAD', symbol: r'C$', name: 'Canadian Dollar', decimals: 2),
  CurrencyMeta(code: 'SGD', symbol: r'S$', name: 'Singapore Dollar', decimals: 2),
  CurrencyMeta(code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0),
];

CurrencyMeta getCurrency(String code) {
  return currencies.cast<CurrencyMeta?>().firstWhere(
        (item) => item!.code == code,
        orElse: () => currencies[1],
      )!;
}

String formatMoney(
  double amount, {
  String currencyCode = 'USD',
  bool sign = false,
  bool compact = false,
}) {
  final currency = getCurrency(currencyCode);
  final absolute = amount.abs();
  String formatted;
  if (compact && absolute >= 1000) {
    if (absolute >= 1000000) {
      formatted = '${(absolute / 1000000).toStringAsFixed(1)}M';
    } else {
      formatted = '${(absolute / 1000).toStringAsFixed(1)}K';
    }
  } else {
    formatted = absolute.toStringAsFixed(currency.decimals);
    final parts = formatted.split('.');
    final whole = parts[0];
    final buffer = StringBuffer();
    for (var i = 0; i < whole.length; i++) {
      final fromEnd = whole.length - i;
      buffer.write(whole[i]);
      if (fromEnd > 1 && fromEnd % 3 == 1) buffer.write(',');
    }
    formatted = parts.length > 1 ? '${buffer.toString()}.${parts[1]}' : buffer.toString();
  }

  final prefix = sign
      ? (amount < 0 ? '−' : amount > 0 ? '+' : '')
      : amount < 0
          ? '−'
          : '';
  return '$prefix${currency.symbol}$formatted';
}

double? parseMoneyInput(String value) {
  final cleaned = value.replaceAll(RegExp(r'[^\d.-]'), '');
  if (cleaned.isEmpty || cleaned == '-' || cleaned == '.') return null;
  return double.tryParse(cleaned);
}
