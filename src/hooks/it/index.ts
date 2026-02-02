/**
 * IT Hooks - IT department and technical operations hooks
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// IT dashboard and tickets
export { useITDashboardData } from '../useITDashboardData';
export { useITTickets } from '../useITTickets';

// Technical operations
export { useTechCheck } from '../useTechCheck';
export { useTechIncidents } from '../useTechIncidents';
export { useNetworkZones } from '../useNetworkZones';
export { usePowerDistribution } from '../usePowerDistribution';
export { useSoftwareLicenses } from '../useSoftwareLicenses';

// Equipment
export { useEquipment } from '../useEquipment';
export { useEquipmentCheckout } from '../useEquipmentCheckout';
