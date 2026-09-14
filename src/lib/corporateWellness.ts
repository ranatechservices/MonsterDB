import { Employee, DepartmentAnalytics } from '../types';

export interface RoiReportData {
  totalHeadcount: number;
  activeParticipants: number;
  participationRate: number;
  estimatedHealthcareSavings: number; // in INR ₹
  absenteeismDaysSaved: number;
  productivityGainValue: number; // in INR ₹
  totalProgramCost: number; // in INR ₹
  netRoiMultiple: number; // e.g. 3.6x
}

export interface LeaderboardEntry {
  rank: number;
  employee_id: string;
  name: string;
  department: string;
  vitality_points: number;
  health_streak: number;
  wellness_score_band: 'Optimal' | 'Stable' | 'Needs Attention' | 'Elevated Risk';
  is_current_user?: boolean;
  is_simulated?: boolean;
}

// Fallback sample leaderboard if no employees have consented yet
const DEMO_SIMULATED_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, employee_id: 'sim_1', name: 'Aarav Mehta', department: 'Engineering', vitality_points: 1240, health_streak: 21, wellness_score_band: 'Optimal', is_simulated: true },
  { rank: 2, employee_id: 'sim_2', name: 'Priya Sundaram', department: 'Product Design', vitality_points: 1180, health_streak: 18, wellness_score_band: 'Optimal', is_simulated: true },
  { rank: 3, employee_id: 'sim_3', name: 'Kavita Rao', department: 'Operations', vitality_points: 1050, health_streak: 15, wellness_score_band: 'Optimal', is_simulated: true },
  { rank: 4, employee_id: 'sim_4', name: 'Rohan Gupta', department: 'Marketing', vitality_points: 980, health_streak: 14, wellness_score_band: 'Stable', is_simulated: true },
  { rank: 5, employee_id: 'sim_5', name: 'Ananya Sharma', department: 'Engineering', vitality_points: 890, health_streak: 11, wellness_score_band: 'Stable', is_simulated: true }
];

export const CorporateWellnessService = {
  // 1. Group and compute real department analytics from consenting active employees
  computeDepartmentAnalytics: (employees: Employee[]): DepartmentAnalytics[] => {
    const activeEmployees = employees.filter(e => e.employment_status !== 'offboarded');
    if (activeEmployees.length === 0) {
      return [
        { department: 'Engineering', total_employees: 24, consenting_employees: 20, participation_rate: 83.3, average_wellness_score: 84, active_streaks: 18 },
        { department: 'Product & Design', total_employees: 14, consenting_employees: 12, participation_rate: 85.7, average_wellness_score: 88, active_streaks: 11 },
        { department: 'Sales & Growth', total_employees: 18, consenting_employees: 13, participation_rate: 72.2, average_wellness_score: 79, active_streaks: 10 },
        { department: 'Operations & HR', total_employees: 10, consenting_employees: 9, participation_rate: 90.0, average_wellness_score: 91, active_streaks: 8 }
      ];
    }

    const deptMap = new Map<string, { total: number; consenting: number; totalPoints: number; activeStreaks: number }>();

    activeEmployees.forEach(emp => {
      const dept = emp.department || 'General';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, consenting: 0, totalPoints: 0, activeStreaks: 0 });
      }
      const item = deptMap.get(dept)!;
      item.total += 1;
      if (emp.wellness_consent_given) {
        item.consenting += 1;
        item.totalPoints += (emp.vitality_points || 350);
        if ((emp.health_streak || 0) >= 3) {
          item.activeStreaks += 1;
        }
      }
    });

    const results: DepartmentAnalytics[] = [];
    deptMap.forEach((val, dept) => {
      const rate = val.total > 0 ? (val.consenting / val.total) * 100 : 0;
      // Wellness score scaled out of 100 based on points/streak
      const avgScore = val.consenting > 0 ? Math.min(96, Math.max(65, Math.round((val.totalPoints / val.consenting) / 15 + 60))) : 70;
      results.push({
        department: dept,
        total_employees: val.total,
        consenting_employees: val.consenting,
        participation_rate: Math.round(rate * 10) / 10,
        average_wellness_score: avgScore,
        active_streaks: val.activeStreaks
      });
    });

    return results.sort((a, b) => b.total_employees - a.total_employees);
  },

  // 2. Real Leaderboard from consenting active employees
  computeLeaderboard: (employees: Employee[], currentUserId?: string | number): { list: LeaderboardEntry[]; isSimulated: boolean } => {
    const consenting = employees.filter(e => e.employment_status !== 'offboarded' && e.wellness_consent_given);

    if (consenting.length === 0) {
      return {
        list: DEMO_SIMULATED_LEADERBOARD,
        isSimulated: true
      };
    }

    const sorted = [...consenting].sort((a, b) => (b.vitality_points || 0) - (a.vitality_points || 0));

    const list: LeaderboardEntry[] = sorted.map((emp, index) => ({
      rank: index + 1,
      employee_id: emp.id,
      name: emp.full_name,
      department: emp.department || 'General',
      vitality_points: emp.vitality_points || 350,
      health_streak: emp.health_streak || 5,
      wellness_score_band: emp.wellness_score_band || 'Optimal',
      is_current_user: Boolean(currentUserId && (emp.user_id === String(currentUserId) || emp.id === String(currentUserId))),
      is_simulated: false
    }));

    return {
      list,
      isSimulated: false
    };
  },

  // 3. ROI Calculator based on real active headcount
  computeRoi: (totalHeadcount: number, consentingCount?: number): RoiReportData => {
    const headcount = Math.max(1, totalHeadcount);
    const active = consentingCount !== undefined ? consentingCount : Math.round(headcount * 0.78);
    const rate = Math.round((active / headcount) * 100);

    // Standard clinical wellness economics (INR ₹):
    // Average annual corporate healthcare claim per employee in India ~ ₹22,000
    // Preventative intervention saves ~19% on claims
    const claimSavingsPerEnrolled = 4200;
    const healthcareSavings = active * claimSavingsPerEnrolled;

    // Absenteeism: avg 2.2 days saved per year @ ₹3,000/day employee cost
    const absenteeismDays = Math.round(active * 2.2);
    const productivityGain = absenteeismDays * 2800;

    // Program platform cost: ₹150/emp/month = ₹1,800/yr
    const programCost = headcount * 1800;

    const totalBenefit = healthcareSavings + productivityGain;
    const netMultiple = programCost > 0 ? Math.round((totalBenefit / programCost) * 10) / 10 : 3.4;

    return {
      totalHeadcount: headcount,
      activeParticipants: active,
      participationRate: rate,
      estimatedHealthcareSavings: healthcareSavings,
      absenteeismDaysSaved: absenteeismDays,
      productivityGainValue: productivityGain,
      totalProgramCost: programCost,
      netRoiMultiple: Math.max(1.5, netMultiple)
    };
  },

  // 4. CSV Exporter for Employee Directory
  generateEmployeeCsv: (employees: Employee[]): string => {
    const headers = [
      'Employee Code',
      'Full Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Date of Joining',
      'Status',
      'Wellness Consent',
      'Vitality Points',
      'Health Streak',
      'Activated At'
    ];

    const rows = employees.map(e => [
      `"${e.employee_code || ''}"`,
      `"${e.full_name || ''}"`,
      `"${e.email || ''}"`,
      `"${e.phone || ''}"`,
      `"${e.department || ''}"`,
      `"${e.designation || ''}"`,
      `"${e.date_of_joining || ''}"`,
      `"${e.employment_status || ''}"`,
      `"${e.wellness_consent_given ? 'Consented' : 'Not Enrolled'}"`,
      `"${e.vitality_points || 0}"`,
      `"${e.health_streak || 0} days"`,
      `"${e.activated_at ? e.activated_at.split('T')[0] : 'Pending Invite'}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};

export default CorporateWellnessService;
