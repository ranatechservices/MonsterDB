import { Request, Response } from 'express';
import { continuityService } from '../services/continuityService';
import { timelineRepository } from '../repositories/timelineRepository';
import { followupRepository } from '../repositories/followupRepository';
import { doctorNotesRepository } from '../repositories/doctorNotesRepository';
import { evidenceRepository } from '../repositories/evidenceRepository';

export class ContinuityController {
  static async getOverview(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const data = await continuityService.getOverview(userId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getTimeline(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string || '100', 10);
      const events = await timelineRepository.getLiveTimeline(userId, limit);
      res.json({
        success: true,
        events,
        disclaimer: "AI-generated educational timeline. It does not constitute a diagnosis or medical advice."
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getChanges(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const changes = await continuityService.getChanges(userId);
      res.json({
        success: true,
        ...changes
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getDoctorBrief(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const brief = await continuityService.generateDoctorBrief(userId);
      res.json({
        success: true,
        brief
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async searchHistory(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const results = await continuityService.searchHealthHistory(userId, query);
      res.json({
        success: true,
        ...results
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPassport(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const passport = await continuityService.getHealthPassport(userId);
      res.json({
        success: true,
        passport
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Followups
  static async listFollowups(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const status = req.query.status as string;
      const followups = await followupRepository.listByUserId(userId, status);
      res.json({ success: true, followups });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createFollowup(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const { title, description, dueDate, category, priority, evidenceSourceType, evidenceSourceId } = req.body;
      if (!title || !dueDate) {
        res.status(400).json({ success: false, error: 'Title and due date are required' });
        return;
      }
      const item = await followupRepository.create({
        user_id: userId,
        title,
        description,
        due_date: dueDate,
        category: category || 'LAB_RETEST',
        priority: priority || 'MEDIUM',
        status: 'UPCOMING',
        evidence_source_type: evidenceSourceType,
        evidence_source_id: evidenceSourceId
      });
      res.status(201).json({ success: true, followup: item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateFollowup(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const id = String(req.params.id);
      const patch = req.body;
      const updated = await followupRepository.update(id, userId, patch);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Followup not found' });
        return;
      }
      res.json({ success: true, followup: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Doctor Notes
  static async listDoctorNotes(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const notes = await doctorNotesRepository.listByUserId(userId);
      res.json({ success: true, doctorNotes: notes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createDoctorNote(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const { doctorName, specialty, visitDate, chiefComplaint, clinicalObservations, diagnosisImpressions, treatmentPlan, prescriptionsRecorded } = req.body;
      if (!doctorName || !chiefComplaint) {
        res.status(400).json({ success: false, error: 'Doctor name and chief complaint are required' });
        return;
      }
      const note = await doctorNotesRepository.create({
        user_id: userId,
        doctor_name: doctorName,
        specialty,
        visit_date: visitDate || new Date().toISOString().split('T')[0],
        chief_complaint: chiefComplaint,
        clinical_observations: clinicalObservations,
        diagnosis_impressions: diagnosisImpressions,
        treatment_plan: treatmentPlan,
        prescriptions_recorded: prescriptionsRecorded || [],
        doctor_verified: true
      });
      res.status(201).json({ success: true, doctorNote: note });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Evidence links
  static async listEvidence(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const targetType = req.query.targetType as string;
      const targetId = req.query.targetId as string;
      let links;
      if (targetType && targetId) {
        links = await evidenceRepository.findByTarget(userId, targetType, targetId);
      } else {
        links = await evidenceRepository.listByUserId(userId);
      }
      res.json({ success: true, evidenceLinks: links });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createEvidence(req: Request, res: Response, userId: string): Promise<void> {
    try {
      const { targetType, targetId, sourceType, sourceId, confidence, supportingExcerpt, clinicalRationale } = req.body;
      if (!targetType || !targetId || !sourceType || !sourceId || !supportingExcerpt) {
        res.status(400).json({ success: false, error: 'Missing required evidence link parameters' });
        return;
      }
      const link = await evidenceRepository.create({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        source_type: sourceType,
        source_id: sourceId,
        confidence: confidence || 0.95,
        supporting_excerpt: supportingExcerpt,
        clinical_rationale: clinicalRationale
      });
      res.status(201).json({ success: true, evidenceLink: link });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
