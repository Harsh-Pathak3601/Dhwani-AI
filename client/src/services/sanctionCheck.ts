import api from './api';

export interface SanctionCheckResult {
  sanctioned: boolean;
  source?: string;
  details?: string;
}

/**
 * Check if a phone number appears in any known sanction or blocklist databases.
 * Currently a stub — returns unsanctioned by default.
 * Wire this up to a real sanctions/blocklist API when available.
 */
export const checkSanctions = async (number: string): Promise<SanctionCheckResult> => {
  try {
    const { data } = await api.get<SanctionCheckResult>(`/sanctions/check/${number}`);
    return data;
  } catch (error) {
    console.error('Sanction check failed, defaulting to unsanctioned:', error);
    return { sanctioned: false };
  }
};
