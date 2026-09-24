import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CommunityCheckResult {
  flagged: boolean;
  reportsCount: number;
}

export const checkCommunityDB = async (number: string): Promise<CommunityCheckResult> => {
  try {
    const { data } = await api.get<CommunityCheckResult>(`/community/check/${number}`);
    return data;
  } catch (error) {
    console.error('Error checking community DB', error);
    return { flagged: false, reportsCount: 0 };
  }
};

export const reportToCommunityDB = async (callerNumber: string, riskScore: number): Promise<void> => {
  try {
    await api.post('/community', { callerNumber, riskScore });
  } catch (error) {
    console.error('Error reporting to community DB', error);
  }
};


// ── Security Cases / Reports ──

export interface SecurityCase {
  _id: string;
  userId: string;
  sessionId: string;
  callerNumber: string;
  summary: string;
  scamType: string;
  redFlags: string[];
  psychologicalTactics: string[];
  evidenceLog: { time: string; event: string }[];
  recommendedAction?: string;
  formalComplaintText?: string;
  peakRiskScore: number;
  investigationStatus: 'Suspected' | 'Verified' | 'Needs Review';
  investigatorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsResponse {
  reports: SecurityCase[];
  counts: {
    total: number;
    needsReview: number;
    suspected: number;
    verified: number;
  };
  page: number;
  totalPages: number;
}

export const fetchReports = async (params?: {
  status?: string;
  role?: string;
  page?: number;
  search?: string;
}): Promise<ReportsResponse> => {
  try {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.role) query.append('role', params.role);
    if (params?.page) query.append('page', String(params.page));
    if (params?.search) query.append('search', params.search);
    const { data } = await api.get<ReportsResponse>(`/reports?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (error) {
    console.error('Error fetching reports', error);
    return { reports: [], counts: { total: 0, needsReview: 0, suspected: 0, verified: 0 }, page: 1, totalPages: 1 };
  }
};

export const updateCaseInvestigation = async (
  id: string,
  data: { investigationStatus: string; investigatorNotes?: string; reviewerName?: string }
): Promise<SecurityCase> => {
  try {
    const token = localStorage.getItem('token');
    const { data: updated } = await api.patch<SecurityCase>(`/reports/${id}/investigate`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return updated;
  } catch (error) {
    console.error('Error updating case investigation', error);
    throw error;
  }
};

export const seedDemoData = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await api.post('/reports/seed-demo', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Error seeding demo data', error);
  }
};

export default api;
