import { HiringRequest, ResearchRun, MarketBrief } from '../types';
import { SAMPLE_REPORTS, INITIAL_RESEARCH_RUNS } from '../mocks/sampleReports';

/**
 * Set VITE_USE_BACKEND_API=true and VITE_BACKEND_API_URL=http://localhost:8000/api
 * Session cookie is sent with credentials: 'include'.
 */

export const USE_REAL_BACKEND = import.meta.env.VITE_USE_BACKEND_API === 'true';
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `API error ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

class MarketScoutApiService {
  private runs: ResearchRun[] = [...INITIAL_RESEARCH_RUNS];
  private briefs: Record<string, MarketBrief> = { ...SAMPLE_REPORTS };

  async createResearchRun(requestBody: HiringRequest): Promise<{ runId: string; initialStageId: number }> {
    if (USE_REAL_BACKEND) {
      const data = await request<{ runId: string; initialStageId: number }>(`/research`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      return data;
    }

    const runId = `run-${Date.now()}`;
    const newRun: ResearchRun = {
      id: runId,
      role: requestBody.role,
      location: requestBody.location,
      createdAt: new Date().toISOString(),
      status: 'in_progress',
      currentStageId: 1,
      currency: requestBody.currency,
      hitlPending: false,
    };
    this.runs.unshift(newRun);
    return { runId, initialStageId: 1 };
  }

  async getRuns(): Promise<ResearchRun[]> {
    if (USE_REAL_BACKEND) {
      return request<ResearchRun[]>(`/research`);
    }
    return [...this.runs];
  }

  async getRunById(runId: string): Promise<any> {
    if (USE_REAL_BACKEND) {
      return request(`/research/${runId}`);
    }
    return this.runs.find((r) => r.id === runId);
  }

  async resumeRun(runId: string, payload: Record<string, unknown>): Promise<any> {
    if (USE_REAL_BACKEND) {
      return request(`/research/${runId}/resume`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    return this.getRunById(runId);
  }

  async getBrief(briefId: string): Promise<MarketBrief | undefined> {
    if (USE_REAL_BACKEND) {
      if (briefId.startsWith('report-')) {
        return SAMPLE_REPORTS[briefId];
      }
      try {
        return await request<MarketBrief>(`/research/${briefId.replace(/^brief-/, '')}/report`);
      } catch {
        return undefined;
      }
    }
    return this.briefs[briefId];
  }

  async saveBrief(brief: MarketBrief): Promise<void> {
    this.briefs[brief.id] = brief;
    const run = this.runs.find((r) => r.id === brief.requestId || r.briefId === brief.id);
    if (run) {
      run.briefId = brief.id;
      run.status = 'completed';
      run.currentStageId = 6;
      run.hiringOutlook = brief.hiringOutlook.verdict;
      run.totalPostingsIndexed = brief.demandVolume.totalActivePostings;
      run.salaryMedian = brief.compensation.medianSalary;
    }
  }

  async deleteRun(runId: string): Promise<void> {
    this.runs = this.runs.filter((r) => r.id !== runId);
  }

  async loginWithGoogle(credential: string) {
    return request<{ user: any }>(`/auth/google`, {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  }

  async loginWithSandbox(email = 'operator@marketscout.ai') {
    return request<{ user: any }>(`/auth/sandbox`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async currentUser() {
    return request(`/auth/me`);
  }

  async logout() {
    return request(`/auth/logout`, { method: 'POST' });
  }
}

export const apiService = new MarketScoutApiService();
