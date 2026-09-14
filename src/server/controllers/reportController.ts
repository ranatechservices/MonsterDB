import { Request, Response } from 'express';
import { ReportRepository } from '../repositories/reportRepository';
import { ReportService } from '../services/reportService';
import { AnalysisJobService } from '../services/analysisJobService';
import { PDFExportService } from '../services/pdfExportService';
import { AuditLogRepository } from '../repositories/auditLogRepository';

export class ReportController {
  public static async uploadReport(req: Request, res: Response, userId: string) {
    try {
      const { title, category, report_date, lab_name, doctor_name, raw_text, auto_analyze } = req.body;
      const file = (req as any).file;

      const result = await ReportService.uploadAndCreateReport({
        userId,
        title: title || (file ? file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : 'Clinical Lab Test'),
        category: category || 'blood',
        reportDate: report_date,
        labName: lab_name,
        doctorName: doctor_name,
        fileBuffer: file ? file.buffer : undefined,
        originalFilename: file ? file.originalname : undefined,
        mimeType: file ? file.mimetype : undefined,
        rawText: raw_text,
        autoAnalyze: auto_analyze === 'true' || auto_analyze === true,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        report: result.report,
        job: result.job
      });
    } catch (error: any) {
      console.error('[ReportController] Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload report' });
    }
  }

  public static async listReports(req: Request, res: Response, userId: string) {
    try {
      const reports = await ReportRepository.getReportsByUserId(userId);
      res.json({ success: true, reports });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch reports' });
    }
  }

  public static async getReportBundle(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const bundle = await ReportRepository.getFullReportBundle(id, userId);

      if (!bundle || !bundle.report) {
        return res.status(404).json({ error: 'Report not found or access denied' });
      }

      await AuditLogRepository.log({
        user_id: userId,
        action: 'REPORT_VIEWED',
        resource_type: 'medical_report',
        resource_id: id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ success: true, ...bundle });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch report details' });
    }
  }

  public static async triggerAnalysis(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const { raw_text } = req.body || {};

      const report = await ReportRepository.getReportById(id, userId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found or access denied' });
      }

      const job = await AnalysisJobService.startAnalysisJob({
        reportId: id,
        userId,
        rawTextOverride: raw_text
      });

      await AuditLogRepository.log({
        user_id: userId,
        action: 'REPORT_ANALYSIS_STARTED',
        resource_type: 'medical_report',
        resource_id: id,
        metadata: { jobId: job.id }
      });

      res.json({ success: true, job });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to start analysis job' });
    }
  }

  public static async getAnalysis(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const report = await ReportRepository.getReportById(id, userId);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      const analysis = await ReportRepository.getAnalysisByReportId(id);
      res.json({ success: true, analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch analysis' });
    }
  }

  public static async getFindings(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const report = await ReportRepository.getReportById(id, userId);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      const findings = await ReportRepository.getFindingsByReportId(id);
      res.json({ success: true, findings });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch findings' });
    }
  }

  public static async getQuestions(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const report = await ReportRepository.getReportById(id, userId);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      const questions = await ReportRepository.getQuestionsByReportId(id);
      res.json({ success: true, questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch questions' });
    }
  }

  public static async getRecommendations(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const report = await ReportRepository.getReportById(id, userId);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      const recommendations = await ReportRepository.getRecommendationsByReportId(id);
      res.json({ success: true, recommendations });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch recommendations' });
    }
  }

  public static async getTrends(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const report = await ReportRepository.getReportById(id, userId);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      const trends = await ReportRepository.getTrendsByUserId(userId);
      res.json({ success: true, trends });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch trends' });
    }
  }

  public static async deleteReport(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const deleted = await ReportRepository.softDeleteReport(id, userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Report not found or already removed' });
      }

      await AuditLogRepository.log({
        user_id: userId,
        action: 'REPORT_DELETED',
        resource_type: 'medical_report',
        resource_id: id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.json({ success: true, message: 'Report safely removed' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete report' });
    }
  }

  public static async getReportFile(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const fileRecord = await ReportRepository.getReportFile(id, userId);
      if (!fileRecord || !fileRecord.file_data_base64) {
        return res.status(404).json({ error: 'File attachment not found' });
      }

      const buffer = Buffer.from(fileRecord.file_data_base64, 'base64');
      res.setHeader('Content-Type', fileRecord.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${fileRecord.original_filename || 'lab_report'}"`);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to retrieve report file' });
    }
  }

  public static async exportPDF(req: Request, res: Response, userId: string) {
    try {
      const id = String(req.params.id);
      const html = await PDFExportService.generateReportHTML(id, userId);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      res.status(500).send(`<h3>Error generating report print export: ${error.message}</h3>`);
    }
  }
}
