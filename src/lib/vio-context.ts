export function vioPageId(pathname: string): string {
  if (pathname === '/') return 'dashboard'
  return pathname.replace(/^\//, '').split('/')[0] || 'dashboard'
}

export function vioSuggestions(pathname: string): string[] {
  const page = vioPageId(pathname)
  if (page === 'transactions') {
    return ['Find my largest expenses', 'What spending patterns do you see?', 'Show unusual transactions']
  }
  if (page === 'budgets') {
    return ['Which budgets are at risk?', 'Am I overspending anywhere?', 'Am I on track with my budget?']
  }
  if (page === 'analytics' || page === 'insights') {
    return ["Explain this month's trend", 'What changed from last month?', 'What categories increased?']
  }
  if (page === 'goals') {
    return ['How are my goals progressing?', 'How can I save more?']
  }
  return ["What's changed this month?", 'How am I doing overall?', 'Where am I spending the most?']
}
