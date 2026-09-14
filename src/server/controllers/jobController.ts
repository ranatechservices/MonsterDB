import { Request, Response } from 'express';
import { AnalysisJobRepository } from '../repositories/analysisJobRepository';

export class JobController {
  public static async getJobStatus(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const job = await AnalysisJobRepository.getJobById(id, userId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found or access denied' });
      }

      res.json({ success: true, job });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch job status' });
    }
  }
}
