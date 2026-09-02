class AppEnv {
  const AppEnv({
    this.supabaseUrl = '',
    this.supabaseAnonKey = '',
    this.dataBackend = '',
    this.insightsApiUrl = defaultInsightsApiUrl,
  });

  static const defaultInsightsApiUrl = 'https://expense-manager-jj72.onrender.com/api';
  static const authRedirect = 'com.aureum.aureum://login-callback';

  static const _supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: String.fromEnvironment('VITE_SUPABASE_URL'),
  );
  static const _supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: String.fromEnvironment(
      'SUPABASE_PUBLISHABLE_KEY',
      defaultValue: String.fromEnvironment(
        'VITE_SUPABASE_ANON_KEY',
        defaultValue: String.fromEnvironment('VITE_SUPABASE_PUBLISHABLE_KEY'),
      ),
    ),
  );
  static const _dataBackend = String.fromEnvironment(
    'DATA_BACKEND',
    defaultValue: String.fromEnvironment('VITE_DATA_BACKEND'),
  );
  static const _insightsApiUrl = String.fromEnvironment(
    'INSIGHTS_API_URL',
    defaultValue: defaultInsightsApiUrl,
  );

  final String supabaseUrl;
  final String supabaseAnonKey;
  final String dataBackend;
  final String insightsApiUrl;

  static const current = AppEnv(
    supabaseUrl: _supabaseUrl,
    supabaseAnonKey: _supabaseAnonKey,
    dataBackend: _dataBackend,
    insightsApiUrl: _insightsApiUrl,
  );

  bool get hasSupabaseConfig => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  String get resolveBackend {
    if (dataBackend == 'local') return 'local';
    if (hasSupabaseConfig) return 'supabase';
    return 'local';
  }

  bool get isLocalBackend => resolveBackend == 'local';
}
