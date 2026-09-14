import crypto from 'crypto';
import { ReportRepository, MedicalReportRecord } from '../repositories/reportRepository';
import { AuditLogRepository } from '../repositories/auditLogRepository';
import { AnalysisJobService } from './analysisJobService';
import { AnalysisJobRecord } from '../repositories/analysisJobRepository';

export class ReportService {
  /**
   * Handles report creation with file upload
   */
  public static async uploadAndCreateReport(params: {
    userId: string;
    title: string;
    category?: string;
    reportDate?: string;
    labName?: string;
    doctorName?: string;
    fileBuffer?: Buffer;
    originalFilename?: string;
    mimeType?: string;
    rawText?: string;
    autoAnalyze?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ report: MedicalReportRecord; job?: AnalysisJobRecord }> {
    const {
      userId,
      title,
      category,
      reportDate,
      labName,
      doctorName,
      fileBuffer,
      originalFilename,
      mimeType,
      rawText,
      autoAnalyze,
      ipAddress,
      userAgent
    } = params;

    // 1. Create Report in Database
    const report = await ReportRepository.createReport({
      user_id: userId,
      title: title || 'Clinical Lab Test',
      category: category || 'blood',
      report_date: reportDate,
      lab_name: labName,
      doctor_name: doctorName,
      raw_extracted_text: rawText,
      status: 'pending'
    });

    // 2. Save File if present
    if (fileBuffer && originalFilename && mimeType) {
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const storageKey = `reports/${userId}/${report.id}_${Date.now()}_${originalFilename}`;

      await ReportRepository.saveReportFile({
        report_id: report.id,
        user_id: userId,
        storage_key: storageKey,
        original_filename: originalFilename,
        mime_type: mimeType,
        file_size_bytes: fileBuffer.length,
        checksum_sha256: checksum,
        file_data_base64: fileBuffer.toString('base64')
      });
    }

    // 3. Log Audit entry
    await AuditLogRepository.log({
      user_id: userId,
      action: 'REPORT_UPLOAD',
      resource_type: 'medical_report',
      resource_id: report.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        title: report.title,
        category: report.category,
        has_file: !!fileBuffer
      }
    });

    // 4. Auto-trigger analysis job if requested
    let job: AnalysisJobRecord | undefined = undefined;
    if (autoAnalyze) {
      job = await AnalysisJobService.startAnalysisJob({
        reportId: report.id,
        userId,
        rawTextOverride: rawText
      });
    }

    return { report, job };
  }
}
