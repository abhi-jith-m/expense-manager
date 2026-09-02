import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/appearance.dart';

class AppearanceController extends ChangeNotifier {
  AppearanceController(this._prefs);

  final SharedPreferences _prefs;
  AppearancePreferences appearance = defaultAppearance;

  void load([String? userId]) {
    final raw = _prefs.getString(appearanceKey(userId)) ?? _prefs.getString(appearanceStorageKey);
    if (raw == null) {
      appearance = defaultAppearance;
      notifyListeners();
      return;
    }
    try {
      appearance = parseAppearance(jsonDecode(raw));
    } catch (_) {
      appearance = defaultAppearance;
    }
    notifyListeners();
  }

  Future<void> update(AppearancePreferences value, [String? userId]) async {
    appearance = value;
    final payload = jsonEncode(value.toJson());
    await _prefs.setString(appearanceStorageKey, payload);
    if (userId != null) await _prefs.setString(appearanceKey(userId), payload);
    notifyListeners();
  }

  ThemeMode get themeMode => switch (appearance.theme) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      };
}
