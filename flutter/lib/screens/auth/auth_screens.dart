import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/env.dart';
import '../../core/errors.dart';
import '../../state/auth_controller.dart';
import '../../state/finance_controller.dart';
import '../../widgets/app_widgets.dart';

bool _validEmail(String value) => RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(value);

class AuthLayout extends StatelessWidget {
  const AuthLayout({super.key, required this.title, required this.subtitle, required this.child});

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 900;
    final mobile = Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const BrandMark(size: 64),
              const SizedBox(height: 16),
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 6),
              Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: context.aureum.label)),
              const SizedBox(height: 24),
              child,
            ],
          ),
        ),
      ),
    );

    if (!wide) return Scaffold(body: SafeArea(child: SingleChildScrollView(child: mobile)));

    return Scaffold(
      body: Row(
        children: [
          Expanded(
            child: Container(
              color: context.aureum.sidebar,
              padding: const EdgeInsets.all(48),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Aureum', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                  Text('Midnight Violet', style: TextStyle(color: context.aureum.sidebarMuted, fontSize: 12)),
                  const Spacer(),
                  Text(
                    'See your money clearly, without the noise.',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'A calm workspace for income, spending, budgets, and goals — designed for long sessions, not dashboard theater.',
                    style: TextStyle(color: context.aureum.sidebarMuted),
                  ),
                  const Spacer(),
                  Text(
                    'Private by default. Your data stays isolated to your account.',
                    style: TextStyle(color: context.aureum.sidebarMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          Expanded(child: SingleChildScrollView(child: mobile)),
        ],
      ),
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final email = TextEditingController();
  final password = TextEditingController();
  String? emailError;
  String? passwordError;
  bool submitting = false;

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      emailError = _validEmail(email.text) ? null : 'Enter a valid email address';
      passwordError = password.text.length >= 8 ? null : 'Password must be at least 8 characters';
    });
    if (emailError != null || passwordError != null) return;
    setState(() => submitting = true);
    try {
      await context.read<AuthController>().signIn(email.text.trim(), password.text);
      if (!mounted) return;
      await context.read<FinanceController>().refresh();
      if (!mounted) return;
      context.go('/');
    } catch (error) {
      if (mounted) showSnack(context, toUserMessage(error), error: true);
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    return AuthLayout(
      title: 'Welcome back',
      subtitle: 'Sign in to continue to your workspace.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: 'Email', errorText: emailError),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: password,
            obscureText: true,
            decoration: InputDecoration(labelText: 'Password', errorText: passwordError),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(onPressed: () => context.go('/forgot-password'), child: const Text('Forgot password?')),
          ),
          FilledButton(onPressed: submitting ? null : _submit, child: Text(submitting ? 'Signing in…' : 'Sign in')),
          if (auth.client.backend == 'supabase') ...[
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () async {
                try {
                  await auth.client.signInWithGoogle();
                } catch (error) {
                  if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                }
              },
              child: const Text('Continue with Google'),
            ),
          ],
          const SizedBox(height: 24),
          Text.rich(
            TextSpan(
              text: 'New to Aureum? ',
              children: [
                WidgetSpan(
                  child: GestureDetector(
                    onTap: () => context.go('/signup'),
                    child: Text('Create an account', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  String? nameError;
  String? emailError;
  String? passwordError;
  bool submitting = false;

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      nameError = name.text.trim().length >= 2 ? null : 'Name must be at least 2 characters';
      emailError = _validEmail(email.text) ? null : 'Enter a valid email address';
      passwordError = password.text.length >= 8 ? null : 'Password must be at least 8 characters';
    });
    if (nameError != null || emailError != null || passwordError != null) return;
    setState(() => submitting = true);
    try {
      await context.read<AuthController>().signUp(email.text.trim(), password.text, name.text.trim());
      if (!mounted) return;
      await context.read<FinanceController>().refresh();
      if (!mounted) return;
      context.go('/onboarding');
    } catch (error) {
      if (mounted) showSnack(context, toUserMessage(error), error: true);
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'Create your workspace',
      subtitle: 'Start with a private account. You can add accounts and budgets next.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: name, decoration: InputDecoration(labelText: 'Name', errorText: nameError)),
          const SizedBox(height: 12),
          TextField(
            controller: email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: 'Email', errorText: emailError),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: password,
            obscureText: true,
            decoration: InputDecoration(labelText: 'Password', errorText: passwordError),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: submitting ? null : _submit, child: Text(submitting ? 'Creating account…' : 'Create account')),
          const SizedBox(height: 24),
          Text.rich(
            TextSpan(
              text: 'Already have an account? ',
              children: [
                WidgetSpan(
                  child: GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Text('Sign in', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final email = TextEditingController();
  bool submitting = false;

  @override
  void dispose() {
    email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'Reset your password',
      subtitle: 'We’ll email a reset link if this address has an account.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: submitting
                ? null
                : () async {
                    setState(() => submitting = true);
                    try {
                      await context.read<AuthController>().client.requestPasswordReset(email.text.trim());
                      if (!context.mounted) return;
                      showSnack(
                        context,
                        AppEnv.current.isLocalBackend
                            ? 'Local mode does not send email. Sign in and change your password in Settings.'
                            : 'If an account exists, a reset link is on its way.',
                      );
                    } catch (error) {
                      if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                    } finally {
                      if (mounted) setState(() => submitting = false);
                    }
                  },
            child: const Text('Send reset link'),
          ),
          const SizedBox(height: 24),
          TextButton(onPressed: () => context.go('/login'), child: const Text('Back to sign in')),
        ],
      ),
    );
  }
}

class ResetPasswordPage extends StatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final password = TextEditingController();
  final confirm = TextEditingController();
  String? confirmError;

  @override
  void dispose() {
    password.dispose();
    confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      title: 'Choose a new password',
      subtitle: 'Use at least 8 characters.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'New password')),
          const SizedBox(height: 12),
          TextField(
            controller: confirm,
            obscureText: true,
            decoration: InputDecoration(labelText: 'Confirm password', errorText: confirmError),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () async {
              setState(() => confirmError = password.text == confirm.text ? null : 'Passwords do not match');
              if (confirmError != null || password.text.length < 8) return;
              try {
                await context.read<AuthController>().client.updatePassword(password.text);
                if (!context.mounted) return;
                showSnack(context, 'Password updated');
                context.go('/login');
              } catch (error) {
                if (context.mounted) showSnack(context, toUserMessage(error), error: true);
              }
            },
            child: const Text('Update password'),
          ),
        ],
      ),
    );
  }
}
