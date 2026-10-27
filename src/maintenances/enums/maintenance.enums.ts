export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** Estados "activos": ocupan el vehículo y la agenda del mecánico */
export const ACTIVE_MAINTENANCE_STATUSES = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];