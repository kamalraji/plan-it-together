/**
 * Catering Hooks - Catering and food service hooks
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// Menu items
export { useCateringMenuItems, useCateringMenuMutations } from '../useCateringData';

// Vendors
export { useCateringVendors, useCateringVendorMutations } from '../useCateringData';

// Inventory
export { useCateringInventory, useCateringInventoryMutations } from '../useCateringData';

// Meal schedule
export { useCateringMealSchedule, useCateringMealScheduleMutations } from '../useCateringData';

// Dietary requirements
export { useDietaryRequirements, useDietaryRequirementMutations } from '../useCateringData';

// Headcount confirmations
export { useHeadcountConfirmations, useHeadcountMutations } from '../useCateringData';

// Stats
export { useCateringStats } from '../useCateringData';
