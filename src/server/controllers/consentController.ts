import { Request, Response } from 'express';
import { UserConsentRepository } from '../repositories/userConsentRepository';
import { AuditLogRepository } from '../repositories/auditLogRepository';

export class ConsentController {
  public static async recordConsent(req: Request, res: Response, userId: string) {
    try {
      const { consent_type, consent_version, granted, disclaimer_text_shown } = req.body;

      const consent = await UserConsentRepository.recordConsent({
        user_id: userId,
        consent_type: consent_type || 'ai_lab_analysis',
        consent_version: consent_version || 'v1.0',
        granted: granted !== false,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        disclaimer_text_shown
      });

      await AuditLogRepository.log({
        user_id: userId,
        action: 'CONSENT_GRANTED',
        resource_type: 'user_consent',
        resource_id: consent.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        metadata: { consent_type: consent.consent_type, version: consent.consent_version }
      });

      res.status(201).json({ success: true, consent });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to record consent' });
    }
  }

  public static async getLatestConsent(req: Request, res: Response, userId: string) {
    try {
      const type = (req.query.type as string) || 'ai_lab_analysis';
      const consent = await UserConsentRepository.getLatestConsent(userId, type);
      res.json({ success: true, consent: consent || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch user consent' });
    }
  }
}
