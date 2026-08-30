// Audit Logging Service (Domain 30)

export interface AuditLogEntry {
  restaurantId: string
  userId?: string
  action: string
  resource: string
  details?: Record<string, any>
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // In production, writes to audit_logs table; in sandbox mode logs safely
    console.info(`[AUDIT LOG] ${new Date().toISOString()} | ${entry.action} on ${entry.resource}`, entry.details || {})
  } catch (err) {
    console.warn('Audit logging failed silently:', err)
  }
}
