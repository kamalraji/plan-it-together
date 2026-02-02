import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/promo_code.dart';
import 'package:thittam1hub/services/registration_flow_service.dart';
import 'package:thittam1hub/theme.dart';

/// Ticket selection bottom sheet with quantity control and promo codes
class TicketSelectionSheet extends StatefulWidget {
  final Event event;
  final List<TicketTier> tiers;
  final TicketTier? preselectedTier;
  final VoidCallback onContinue;
  final RegistrationFlowService flowService;

  const TicketSelectionSheet({
    super.key,
    required this.event,
    required this.tiers,
    this.preselectedTier,
    required this.onContinue,
    required this.flowService,
  });

  @override
  State<TicketSelectionSheet> createState() => _TicketSelectionSheetState();
}

class _TicketSelectionSheetState extends State<TicketSelectionSheet> {
  final _promoController = TextEditingController();
  bool _isPromoExpanded = false;
  String? _promoError;
  bool _promoApplied = false;

  @override
  void initState() {
    super.initState();
    if (widget.preselectedTier != null) {
      widget.flowService.selectTier(widget.preselectedTier!);
    } else if (widget.tiers.isNotEmpty) {
      // Auto-select first available tier
      final available = widget.tiers.where((t) => t.available > 0).toList();
      if (available.isNotEmpty) {
        widget.flowService.selectTier(available.first);
      }
    }
  }

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  Future<void> _validatePromoCode() async {
    final code = _promoController.text.trim();
    if (code.isEmpty) return;

    HapticFeedback.lightImpact();
    
    final result = await widget.flowService.validatePromoCode(
      code,
      widget.event.id,
    );

    setState(() {
      if (result.isValid) {
        _promoApplied = true;
        _promoError = null;
      } else {
        _promoError = result.errorMessage;
        _promoApplied = false;
      }
    });
  }

  void _removePromoCode() {
    HapticFeedback.lightImpact();
    widget.flowService.removePromoCode();
    setState(() {
      _promoApplied = false;
      _promoError = null;
      _promoController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return ListenableBuilder(
      listenable: widget.flowService,
      builder: (context, _) {
        final selectedTier = widget.flowService.selectedTier;
        final quantity = widget.flowService.quantity;
        final subtotal = widget.flowService.subtotal;
        final discount = widget.flowService.discountAmount;
        final total = widget.flowService.total;
        final appliedPromo = widget.flowService.appliedPromoCode;

        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.outline.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Select Tickets',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                      style: IconButton.styleFrom(
                        backgroundColor: theme.colorScheme.surfaceContainerHighest,
                      ),
                    ),
                  ],
                ),
              ),

              // Ticket tiers
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Tier selection
                      ...widget.tiers.map((tier) => _TierCard(
                        tier: tier,
                        isSelected: selectedTier?.id == tier.id,
                        quantity: selectedTier?.id == tier.id ? quantity : 0,
                        onSelect: () {
                          HapticFeedback.selectionClick();
                          widget.flowService.selectTier(tier);
                        },
                        onQuantityChanged: (qty) {
                          widget.flowService.setQuantity(qty);
                        },
                        maxQuantity: widget.flowService.maxQuantity,
                      )),

                      const SizedBox(height: 16),

                      // Promo code section
                      _buildPromoSection(theme, appliedPromo),

                      const SizedBox(height: 16),

                      // Price summary
                      if (selectedTier != null) ...[
                        const Divider(),
                        const SizedBox(height: 12),
                        _buildPriceSummary(theme, subtotal, discount, total, quantity),
                        const SizedBox(height: 16),
                      ],

                      // Continue button
                      FilledButton(
                        onPressed: widget.flowService.hasValidSelection
                            ? () {
                                HapticFeedback.mediumImpact();
                                widget.onContinue();
                              }
                            : null,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          widget.flowService.isFreeRegistration
                              ? 'Continue to Register'
                              : 'Continue • ₹${total.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPromoSection(ThemeData theme, PromoCode? appliedPromo) {
    if (appliedPromo != null) {
      // Show applied promo
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.success.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.success.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(Icons.check_circle, color: AppColors.success, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appliedPromo.code.toUpperCase(),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.success,
                    ),
                  ),
                  Text(
                    appliedPromo.formattedDiscount,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: _removePromoCode,
              icon: const Icon(Icons.close, size: 18),
              style: IconButton.styleFrom(
                foregroundColor: AppColors.success,
              ),
            ),
          ],
        ),
      );
    }

    // Show promo input
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: () => setState(() => _isPromoExpanded = !_isPromoExpanded),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Icon(
                  Icons.local_offer_outlined,
                  size: 18,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Have a promo code?',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                Icon(
                  _isPromoExpanded ? Icons.expand_less : Icons.expand_more,
                  color: theme.colorScheme.primary,
                ),
              ],
            ),
          ),
        ),
        
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _promoController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      hintText: 'Enter code',
                      errorText: _promoError,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: widget.flowService.isValidatingPromo
                      ? null
                      : _validatePromoCode,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  child: widget.flowService.isValidatingPromo
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Apply'),
                ),
              ],
            ),
          ),
          crossFadeState: _isPromoExpanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
      ],
    );
  }

  Widget _buildPriceSummary(
    ThemeData theme,
    double subtotal,
    double discount,
    double total,
    int quantity,
  ) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Subtotal ($quantity ${quantity == 1 ? 'ticket' : 'tickets'})',
              style: theme.textTheme.bodyMedium,
            ),
            Text(
              '₹${subtotal.toStringAsFixed(0)}',
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ),
        if (discount > 0) ...[
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Discount',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.success,
                ),
              ),
              Text(
                '-₹${discount.toStringAsFixed(0)}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Total',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              total == 0 ? 'FREE' : '₹${total.toStringAsFixed(0)}',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _TierCard extends StatelessWidget {
  final TicketTier tier;
  final bool isSelected;
  final int quantity;
  final VoidCallback onSelect;
  final ValueChanged<int> onQuantityChanged;
  final int maxQuantity;

  const _TierCard({
    required this.tier,
    required this.isSelected,
    required this.quantity,
    required this.onSelect,
    required this.onQuantityChanged,
    required this.maxQuantity,
  });

  bool get isSoldOut => tier.available <= 0;
  bool get isLowStock => tier.available > 0 && tier.available <= 10;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primaryContainer.withOpacity(0.3)
              : theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? theme.colorScheme.primary
                : isSoldOut
                    ? theme.colorScheme.outline.withOpacity(0.2)
                    : theme.colorScheme.outline.withOpacity(0.3),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isSoldOut ? null : onSelect,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Radio indicator
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected
                                ? theme.colorScheme.primary
                                : theme.colorScheme.outline,
                            width: 2,
                          ),
                        ),
                        child: isSelected
                            ? Center(
                                child: Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: 12),
                      
                      // Tier info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tier.name,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: isSoldOut
                                    ? theme.colorScheme.outline
                                    : null,
                              ),
                            ),
                            if (tier.description != null)
                              Text(
                                tier.description!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                      ),
                      
                      // Price
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            tier.price == 0
                                ? 'FREE'
                                : '₹${tier.price.toStringAsFixed(0)}',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isSoldOut
                                  ? theme.colorScheme.outline
                                  : theme.colorScheme.primary,
                            ),
                          ),
                          Text(
                            'each',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Availability + Quantity controls
                  Row(
                    children: [
                      // Availability badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isSoldOut
                              ? theme.colorScheme.error.withOpacity(0.1)
                              : isLowStock
                                  ? AppColors.warning.withOpacity(0.1)
                                  : theme.colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isSoldOut
                              ? 'SOLD OUT'
                              : tier.isUnlimited
                                  ? 'Available'
                                  : isLowStock
                                      ? '${tier.available} left'
                                      : '${tier.available} available',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isSoldOut
                                ? theme.colorScheme.error
                                : isLowStock
                                    ? AppColors.warning
                                    : theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),

                      const Spacer(),

                      // Quantity controls (only show when selected)
                      if (isSelected && !isSoldOut) ...[
                        _QuantityControl(
                          quantity: quantity,
                          maxQuantity: maxQuantity,
                          onChanged: onQuantityChanged,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _QuantityControl extends StatelessWidget {
  final int quantity;
  final int maxQuantity;
  final ValueChanged<int> onChanged;

  const _QuantityControl({
    required this.quantity,
    required this.maxQuantity,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            onPressed: quantity > 1
                ? () {
                    HapticFeedback.lightImpact();
                    onChanged(quantity - 1);
                  }
                : null,
            icon: const Icon(Icons.remove, size: 18),
            constraints: const BoxConstraints(
              minWidth: 36,
              minHeight: 36,
            ),
            padding: EdgeInsets.zero,
          ),
          Container(
            constraints: const BoxConstraints(minWidth: 32),
            alignment: Alignment.center,
            child: Text(
              '$quantity',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          IconButton(
            onPressed: quantity < maxQuantity
                ? () {
                    HapticFeedback.lightImpact();
                    onChanged(quantity + 1);
                  }
                : null,
            icon: const Icon(Icons.add, size: 18),
            constraints: const BoxConstraints(
              minWidth: 36,
              minHeight: 36,
            ),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}
