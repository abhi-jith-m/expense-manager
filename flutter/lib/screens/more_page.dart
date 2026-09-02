import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/nav.dart';
import '../state/auth_controller.dart';
import '../widgets/app_widgets.dart';

class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    final extras = navItems.where((item) => !primaryDestinations.contains(item.to)).toList();
    return ListView(
      padding: context.density.pagePadding,
      children: [
        AppCard(
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              child: Text((user?.fullName.isNotEmpty ?? false) ? user!.fullName.substring(0, 1).toUpperCase() : 'A'),
            ),
            title: Text(user?.fullName ?? 'Account', overflow: TextOverflow.ellipsis),
            subtitle: Text(user?.email ?? '', overflow: TextOverflow.ellipsis),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile'),
          ),
        ),
        SizedBox(height: context.density.sectionGap),
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (var i = 0; i < extras.length; i++) ...[
                if (i > 0) const Divider(height: 1),
                ListTile(
                  leading: Icon(extras[i].icon),
                  title: Text(extras[i].label),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push(extras[i].to),
                  minVerticalPadding: 16,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
