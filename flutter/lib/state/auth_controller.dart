import 'package:flutter/foundation.dart';

import '../data/client.dart';
import '../models/models.dart';

class AuthController extends ChangeNotifier {
  AuthController(this.client);

  final DataClient client;
  Session? session;
  bool loading = true;
  late final VoidAuthListener _unsubscribe;

  Profile? get user => session?.user;

  Future<void> bootstrap() async {
    _unsubscribe = client.onAuthChange((value) {
      session = value;
      notifyListeners();
    });
    session = await client.getSession();
    loading = false;
    notifyListeners();
  }

  Future<void> signUp(String email, String password, String fullName) async {
    session = await client.signUp(email, password, fullName);
    notifyListeners();
  }

  Future<void> signIn(String email, String password) async {
    session = await client.signIn(email, password);
    notifyListeners();
  }

  Future<void> signOut() async {
    await client.signOut();
    session = null;
    notifyListeners();
  }

  Future<void> refresh() async {
    session = await client.getSession();
    notifyListeners();
  }

  @override
  void dispose() {
    _unsubscribe();
    super.dispose();
  }
}
