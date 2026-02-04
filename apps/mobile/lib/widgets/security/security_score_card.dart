import 'package:flutter/material.dart';
import 'dart:math' as math;

/// Security score display card with animated circular indicator
class SecurityScoreCard extends StatefulWidget {
  final int score; // 0-100
  final List<SecurityRecommendation> recommendations;

  const SecurityScoreCard({
    super.key,
    required this.score,
    this.recommendations = const [],
  });

  @override
  State<SecurityScoreCard> createState() => _SecurityScoreCardState();
}

class _SecurityScoreCardState extends State<SecurityScoreCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0, end: widget.score / 100)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _controller.forward();
  }

  @override
  void didUpdateWidget(SecurityScoreCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.score != widget.score) {
      _animation = Tween<double>(
        begin: oldWidget.score / 100,
        end: widget.score / 100,
      ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getScoreColor() {
    if (widget.score < 40) return Colors.red;
    if (widget.score < 60) return Colors.orange;
    if (widget.score < 80) return Colors.amber;
    return Colors.green;
  }

  String _getScoreLabel() {
    if (widget.score < 40) return 'Needs Attention';
    if (widget.score < 60) return 'Fair';
    if (widget.score < 80) return 'Good';
    return 'Excellent';
  }

  IconData _getScoreIcon() {
    if (widget.score < 40) return Icons.warning;
    if (widget.score < 60) return Icons.info;
    if (widget.score < 80) return Icons.verified_user;
    return Icons.shield;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final scoreColor = _getScoreColor();

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                // Score circle
                AnimatedBuilder(
                  animation: _animation,
                  builder: (context, child) {
                    return SizedBox(
                      width: 100,
                      height: 100,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          CustomPaint(
                            size: const Size(100, 100),
                            painter: _CircularProgressPainter(
                              progress: _animation.value,
                              color: scoreColor,
                              backgroundColor: cs.surfaceContainerHighest,
                              strokeWidth: 8,
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${(100 * _animation.value).round()}',
                                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: scoreColor,
                                ),
                              ),
                              Text(
                                '/100',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(width: 20),
                
                // Score details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(_getScoreIcon(), color: scoreColor, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Security Score',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: scoreColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _getScoreLabel(),
                          style: TextStyle(
                            color: scoreColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.recommendations.isNotEmpty
                            ? '${widget.recommendations.length} recommendation${widget.recommendations.length > 1 ? 's' : ''} to improve'
                            : 'Your account is well protected!',
                        style: TextStyle(
                          color: cs.onSurfaceVariant,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            // Recommendations
            if (widget.recommendations.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              ...widget.recommendations.take(3).map((rec) => _buildRecommendation(rec, cs)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendation(SecurityRecommendation rec, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: InkWell(
        onTap: rec.onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: rec.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(rec.icon, size: 16, color: rec.color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rec.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      '+${rec.points} points',
                      style: TextStyle(
                        color: cs.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: cs.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SecurityRecommendation {
  final String title;
  final IconData icon;
  final Color color;
  final int points;
  final VoidCallback? onTap;

  const SecurityRecommendation({
    required this.title,
    required this.icon,
    this.color = Colors.blue,
    this.points = 10,
    this.onTap,
  });
}

class _CircularProgressPainter extends CustomPainter {
  final double progress;
  final Color color;
  final Color backgroundColor;
  final double strokeWidth;

  _CircularProgressPainter({
    required this.progress,
    required this.color,
    required this.backgroundColor,
    this.strokeWidth = 8,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    final backgroundPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, backgroundPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _CircularProgressPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}
