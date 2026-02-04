import 'package:flutter/material.dart';

class LiveNowIndicator extends StatelessWidget {
  final int liveCount;
  final VoidCallback onTap;

  const LiveNowIndicator({Key? key, required this.liveCount, required this.onTap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.circle, color: Colors.white, size: 10),
            const SizedBox(width: 6),
            Text(
              '$liveCount Live Now',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
