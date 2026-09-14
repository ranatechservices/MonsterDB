import { ReportRepository } from '../repositories/reportRepository';

export class PDFExportService {
  /**
   * Generates a clean, print-ready HTML document for clinical report export
   */
  public static async generateReportHTML(reportId: string, userId?: string): Promise<string> {
    const bundle = await ReportRepository.getFullReportBundle(reportId, userId);
    if (!bundle || !bundle.report) {
      throw new Error('Report not found');
    }

    const { report, parameters, analysis, findings, questions, recommendations } = bundle;

    const attentionBadgeColor =
      report.attention_level === 'URGENT_MEDICAL_REVIEW'
        ? '#dc2626'
        : report.attention_level === 'HIGH_ATTENTION'
        ? '#ea580c'
        : report.attention_level === 'MODERATE_ATTENTION'
        ? '#d97706'
        : '#059669';

    const paramRows = (parameters || [])
      .map((p) => {
        const isAbnormal = p.status !== 'normal';
        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-weight: 500; color: #111827;">${escapeHtml(p.test_name)}</td>
          <td style="padding: 10px 12px; font-weight: 600; color: ${isAbnormal ? '#dc2626' : '#059669'};">
            ${escapeHtml(String(p.result_text))} ${escapeHtml(p.unit || '')}
          </td>
          <td style="padding: 10px 12px; color: #4b5563;">${escapeHtml(p.reference_range_raw || 'Standard')}</td>
          <td style="padding: 10px 12px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: ${
              isAbnormal ? '#fee2e2' : '#d1fae5'
            }; color: ${isAbnormal ? '#991b1b' : '#065f46'};">
              ${escapeHtml(p.status)}
            </span>
          </td>
        </tr>
      `;
      })
      .join('');

    const findingItems = (findings || [])
      .map(
        (f) => `
        <div style="margin-bottom: 12px; padding: 12px; border-radius: 6px; background: ${
          f.finding_type === 'abnormal' ? '#fff1f2' : '#f0fdf4'
        }; border-left: 4px solid ${f.finding_type === 'abnormal' ? '#f43f5e' : '#10b981'};">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${escapeHtml(f.title)}</div>
          <div style="font-size: 13px; color: #334155;">${escapeHtml(f.description)}</div>
        </div>
      `
      )
      .join('');

    const questionItems = (questions || [])
      .map(
        (q, idx) => `
        <div style="margin-bottom: 10px; padding: 10px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <div style="font-weight: 600; font-size: 13px; color: #0f172a;">${idx + 1}. ${escapeHtml(q.question_text)}</div>
          ${
            q.answers?.[0]
              ? `<div style="font-size: 12px; color: #475569; margin-top: 4px; padding-left: 12px; border-left: 2px solid #cbd5e1;">
                  <em>Educational context:</em> ${escapeHtml(q.answers[0].educational_answer)}
                </div>`
              : ''
          }
        </div>
      `
      )
      .join('');

    const recItems = (recommendations || [])
      .map(
        (r) => `
        <li style="margin-bottom: 6px; font-size: 13px; color: #334155;">
          <strong>${escapeHtml(r.title)}:</strong> ${escapeHtml(r.description)}
        </li>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Clinical Lab Report Summary - ${escapeHtml(report.title)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-size: 12pt; }
      .no-print { display: none; }
      @page { margin: 1.5cm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background: #ffffff;
      margin: 0;
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { text-align: left; padding: 10px 12px; background: #f9fafb; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .disclaimer-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; font-size: 11px; color: #92400e; margin-top: 32px; border-radius: 4px; }
    .print-btn { background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <div style="font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px;">Healora Clinical AI Insights</div>
      <h1 style="margin: 4px 0 6px 0; font-size: 24px; color: #0f172a;">${escapeHtml(report.title)}</h1>
      <div style="font-size: 13px; color: #64748b;">
        Date: <strong>${escapeHtml(report.report_date)}</strong> &nbsp;|&nbsp;
        Category: <strong>${escapeHtml(report.category.toUpperCase())}</strong> &nbsp;|&nbsp;
        Lab: <strong>${escapeHtml(report.lab_name || 'Standard Laboratory')}</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <span class="badge" style="background: ${attentionBadgeColor};">
        ${escapeHtml(report.attention_level.replace(/_/g, ' '))}
      </span>
    </div>
  </div>

  <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
    <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Clinical Summary</div>
    <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6;">
      ${escapeHtml(analysis?.report_summary || report.ai_summary || 'Analysis completed.')}
    </p>
  </div>

  <div class="section-title">Extracted Biomarker Parameters</div>
  <table>
    <thead>
      <tr>
        <th>Test Name</th>
        <th>Result</th>
        <th>Reference Interval</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${paramRows || '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #9ca3af;">No extracted parameters.</td></tr>'}
    </tbody>
  </table>

  ${
    findings && findings.length > 0
      ? `
    <div class="section-title">Clinical Findings & Observations</div>
    ${findingItems}
  `
      : ''
  }

  ${
    questions && questions.length > 0
      ? `
    <div class="section-title">Questions to Discuss with Your Doctor</div>
    ${questionItems}
  `
      : ''
  }

  ${
    recommendations && recommendations.length > 0
      ? `
    <div class="section-title">Personalized Care & Lifestyle Guidance</div>
    <ul style="padding-left: 20px; margin-top: 8px;">
      ${recItems}
    </ul>
  `
      : ''
  }

  <div class="disclaimer-box">
    <strong>Medical Disclaimer:</strong> ${escapeHtml(
      analysis?.disclaimer ||
        'AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for interpretation and treatment.'
    )}
  </div>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
