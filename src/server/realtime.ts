import { Response } from 'express';

export type RealtimeEventType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'VITAL_CREATED'
  | 'VITAL_DELETED'
  | 'MEDICINE_CREATED'
  | 'MEDICINE_UPDATED'
  | 'MEDICINE_DELETED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_DELETED'
  | 'REPORT_CREATED'
  | 'REPORT_UPDATED'
  | 'REPORT_DELETED'
  | 'DAILY_LOG_CREATED'
  | 'CARE_CIRCLE_UPDATED'
  | 'ORGANIZATION_UPDATED'
  | 'DOCTOR_UPDATED'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'EMPLOYEE_DELETED'
  | 'EMPLOYEE_INVITED'
  | 'EMPLOYEE_ACTIVATED'
  | 'CHALLENGE_CREATED'
  | 'CHALLENGE_UPDATED'
  | 'NOTIFICATION_BROADCAST'
  | 'SUPPORT_TICKET_UPDATED'
  | 'AUDIT_LOG_ADDED'
  | 'ADMIN_SECURITY_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'SYSTEM_UPDATED';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  entity: string;
  data: any;
  actor?: string;
  timestamp: string;
}

type ClientConnection = {
  id: string;
  res: any;
  userId?: string;
  role?: string;
};

class RealtimeHub {
  private clients: Map<string, ClientConnection> = new Map();

  public addClient(id: string, res: any, userId?: string, role?: string) {
    this.clients.set(id, { id, res, userId, role });

    // Send initial handshake
    this.sendRaw(res, {
      type: 'SYSTEM_UPDATED',
      entity: 'realtime_handshake',
      data: { status: 'connected', clientId: id },
      timestamp: new Date().toISOString()
    });
  }

  public removeClient(id: string) {
    this.clients.delete(id);
  }

  public broadcast(type: RealtimeEventType, entity: string, data: any, actor?: string) {
    const payload: RealtimeEventPayload = {
      type,
      entity,
      data,
      actor,
      timestamp: new Date().toISOString()
    };

    for (const [id, client] of this.clients.entries()) {
      try {
        this.sendRaw(client.res, payload);
      } catch (err) {
        this.clients.delete(id);
      }
    }
  }

  private sendRaw(res: any, payload: RealtimeEventPayload) {
    if (res.write) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } else if (res.send) {
      // fallback
    }
  }
}

export const realtimeHub = new RealtimeHub();
