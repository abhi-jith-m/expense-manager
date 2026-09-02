class AppError implements Exception {
  const AppError(this.message, [this.code = 'app_error']);

  final String message;
  final String code;

  @override
  String toString() => message;
}

String toUserMessage(Object error, [String fallback = 'Something went wrong. Please try again.']) {
  if (error is AppError) return error.message;
  final message = error.toString().toLowerCase();
  if (message.contains('invalid login') || message.contains('invalid credentials')) {
    return 'Email or password is incorrect.';
  }
  if (message.contains('already registered') || message.contains('already exists')) {
    return 'An account with this email already exists.';
  }
  if (message.contains('failed to fetch') ||
      message.contains('cors') ||
      message.contains('xmlhttprequest') ||
      message.contains('clientexception')) {
    return 'Could not reach the insights service. On Chrome, the backend must allow this origin.';
  }
  if (message.contains('network') || message.contains('fetch') || message.contains('socket')) {
    return 'Network error. Check your connection and try again.';
  }
  if (message.contains('jwt') || message.contains('session')) {
    return 'Your session expired. Please sign in again.';
  }
  if (error is Exception) {
    final raw = error.toString();
    return raw.startsWith('Exception: ') ? raw.substring(11) : raw;
  }
  return fallback;
}
