import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResearchRun, HiringRequest, MarketBrief } from '../types';
import { apiService } from '../services/api';
import { INITIAL_RESEARCH_RUNS } from '../mocks/sampleReports';
import { USE_REAL_BACKEND } from '../services/api';

interface ResearchStoreContextType {
  runs: ResearchRun[];
  activeRunId: string | null;
  activeRequest: HiringRequest | null;
  setActiveRunId: (id: string | null) => void;
  setActiveRequest: (req: HiringRequest | null) => void;
  createRun: (req: HiringRequest) => Promise<string>;
  deleteRun: (id: string) => Promise<void>;
  resetToSampleData: () => void;
  clearAllHistory: () => void;
  getBrief: (briefId: string) => Promise<MarketBrief | undefined>;
}

const ResearchStoreContext = createContext<ResearchStoreContextType | undefined>(undefined);

export const ResearchStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [runs, setRuns] = useState<ResearchRun[]>(() => {
    if (USE_REAL_BACKEND) return [];
    const saved = localStorage.getItem('msa_research_runs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_RESEARCH_RUNS;
      }
    }
    return INITIAL_RESEARCH_RUNS;
  });

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<HiringRequest | null>(null);

  useEffect(() => {
    if (USE_REAL_BACKEND) {
      apiService.getRuns().then(setRuns).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!USE_REAL_BACKEND) {
      localStorage.setItem('msa_research_runs', JSON.stringify(runs));
    }
  }, [runs]);

  const createRun = async (req: HiringRequest): Promise<string> => {
    const { runId } = await apiService.createResearchRun(req);
    setActiveRunId(runId);
    setActiveRequest(req);
    const updated = await apiService.getRuns();
    setRuns(updated);
    return runId;
  };

  const deleteRun = async (id: string) => {
    await apiService.deleteRun(id);
    setRuns((prev) => prev.filter((r) => r.id !== id));
    if (activeRunId === id) {
      setActiveRunId(null);
      setActiveRequest(null);
    }
  };

  const resetToSampleData = () => {
    setRuns(INITIAL_RESEARCH_RUNS);
    localStorage.setItem('msa_research_runs', JSON.stringify(INITIAL_RESEARCH_RUNS));
  };

  const clearAllHistory = () => {
    setRuns([]);
    localStorage.setItem('msa_research_runs', JSON.stringify([]));
  };

  const getBrief = async (briefId: string) => {
    return apiService.getBrief(briefId);
  };

  return (
    <ResearchStoreContext.Provider
      value={{
        runs,
        activeRunId,
        activeRequest,
        setActiveRunId,
        setActiveRequest,
        createRun,
        deleteRun,
        resetToSampleData,
        clearAllHistory,
        getBrief,
      }}
    >
      {children}
    </ResearchStoreContext.Provider>
  );
};

export function useResearchStore() {
  const context = useContext(ResearchStoreContext);
  if (!context) {
    throw new Error('useResearchStore must be used within a ResearchStoreProvider');
  }
  return context;
}

