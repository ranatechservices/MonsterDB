import { Request, Response } from 'express';
import { HealthProfileRepository } from '../repositories/healthProfileRepository';
import { AuditLogRepository } from '../repositories/auditLogRepository';

export class HealthProfileController {
  public static async getProfile(req: Request, res: Response, userId: string) {
    try {
      const profile = await HealthProfileRepository.getByUserId(userId);
      res.json({ success: true, profile: profile || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch health profile' });
    }
  }

  public static async updateProfile(req: Request, res: Response, userId: string) {
    try {
      const {
        height_cm,
        weight_kg,
        blood_group,
        allergies,
        chronic_conditions,
        current_medications,
        dietary_preferences,
        smoking_status,
        alcohol_consumption,
        activity_level,
        family_medical_history,
        emergency_notes
      } = req.body;

      let bmi: number | undefined = undefined;
      if (height_cm && weight_kg && height_cm > 0) {
        const heightM = height_cm / 100;
        bmi = parseFloat((weight_kg / (heightM * heightM)).toFixed(2));
      }

      const updated = await HealthProfileRepository.upsert({
        user_id: userId,
        height_cm: height_cm ? parseFloat(height_cm) : undefined,
        weight_kg: weight_kg ? parseFloat(weight_kg) : undefined,
        bmi,
        blood_group,
        allergies: Array.isArray(allergies) ? allergies : undefined,
        chronic_conditions: Array.isArray(chronic_conditions) ? chronic_conditions : undefined,
        current_medications: Array.isArray(current_medications) ? current_medications : undefined,
        dietary_preferences,
        smoking_status,
        alcohol_consumption,
        activity_level,
        family_medical_history: Array.isArray(family_medical_history) ? family_medical_history : undefined,
        emergency_notes
      });

      await AuditLogRepository.log({
        user_id: userId,
        action: 'PROFILE_UPDATED',
        resource_type: 'health_profile',
        resource_id: updated.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ success: true, profile: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update health profile' });
    }
  }
}
