import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'data/factory.dart';
import 'state/appearance_controller.dart';
import 'state/auth_controller.dart';
import 'state/finance_controller.dart';
import 'state/insights_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  await initializeBackend();
  final prefs = await SharedPreferences.getInstance();
  final client = createDataClient(prefs);
  final auth = AuthController(client);
  final finance = FinanceController(client);
  final appearance = AppearanceController(prefs);
  appearance.load();
  final router = createRouter(auth, finance);
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: finance),
        ChangeNotifierProvider.value(value: appearance),
        ChangeNotifierProvider(create: (_) => InsightsController()),
      ],
      child: AureumApp(router: router),
    ),
  );
  await auth.bootstrap();
  if (auth.session != null) {
    appearance.load(auth.user?.id);
    await finance.refresh();
  }
}
