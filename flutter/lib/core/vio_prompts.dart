String vioPageId(String pathname) {
  if (pathname == '/') return 'dashboard';
  return pathname.replaceFirst(RegExp(r'^/'), '').split('/').first;
}

List<String> vioSuggestions(String pathname) {
  final page = vioPageId(pathname);
  return switch (page) {
    'transactions' => [
        'Find my largest expenses',
        'What spending patterns do you see?',
        'Show unusual transactions',
      ],
    'budgets' => [
        'Which budgets are at risk?',
        'Am I overspending anywhere?',
        'Am I on track with my budget?',
      ],
    'analytics' || 'insights' => [
        "Explain this month's trend",
        'What changed from last month?',
        'What categories increased?',
      ],
    'goals' => [
        'How are my goals progressing?',
        'How can I save more?',
      ],
    _ => [
        "What's changed this month?",
        'How am I doing overall?',
        'Where am I spending the most?',
      ],
  };
}
