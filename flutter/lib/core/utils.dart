import 'package:uuid/uuid.dart';

const _uuid = Uuid();

String createId() => _uuid.v4();

double clamp(double value, double min, double max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

List<T> unique<T>(Iterable<T> items) => items.toSet().toList();

Map<K, List<T>> groupBy<T, K>(Iterable<T> items, K Function(T item) keyFn) {
  final acc = <K, List<T>>{};
  for (final item in items) {
    acc.putIfAbsent(keyFn(item), () => []).add(item);
  }
  return acc;
}

const receiptMaxBytes = 8 * 1024 * 1024;
const receiptAccept = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

bool isImageFile(String type) => type.startsWith('image/');

bool isPdfFile(String type, [String? name]) {
  return type == 'application/pdf' || (name?.toLowerCase().endsWith('.pdf') ?? false);
}
