import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/appearance_controller.dart';

Duration appMotion(BuildContext context, [Duration full = const Duration(milliseconds: 220)]) {
  if (MediaQuery.disableAnimationsOf(context)) return Duration.zero;
  try {
    if (context.read<AppearanceController>().appearance.motion == 'reduced') {
      return Duration.zero;
    }
  } catch (_) {}
  return full;
}

bool prefersReducedMotion(BuildContext context) {
  if (MediaQuery.disableAnimationsOf(context)) return true;
  try {
    return context.read<AppearanceController>().appearance.motion == 'reduced';
  } catch (_) {
    return false;
  }
}
