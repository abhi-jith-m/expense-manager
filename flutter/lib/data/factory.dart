import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/env.dart';
import 'client.dart';
import 'local_client.dart';
import 'supabase_client.dart';

DataClient createDataClient(SharedPreferences prefs) {
  if (AppEnv.current.resolveBackend == 'supabase') {
    return SupabaseDataClient(Supabase.instance.client);
  }
  return LocalDataClient(prefs);
}

Future<void> initializeBackend() async {
  if (AppEnv.current.resolveBackend != 'supabase') return;
  await Supabase.initialize(
    url: AppEnv.current.supabaseUrl,
    publishableKey: AppEnv.current.supabaseAnonKey,
  );
}
