import type { CandidateProfile, InterviewProgress } from '../store/candidateSlice';

// Interface for a completed interview record
export interface SavedInterview {
  id: string;
  candidateProfile: CandidateProfile;
  interviewProgress: InterviewProgress;
  finalScore: number | null;
  summary: string | null;
  resumeFile: {
    name: string;
    size: number;
    type: string;
  } | null;
  resumeBase64: string | null;
  completedAt: string;
  savedAt: string;
}

// Key for storing the list of saved interviews
const SAVED_INTERVIEWS_KEY = 'swipe-saved-interviews';
const INTERVIEW_PREFIX = 'swipe-interview-';

/**
 * Get all saved interviews from local storage
 */
export const getSavedInterviews = (): SavedInterview[] => {
  try {
    const savedList = localStorage.getItem(SAVED_INTERVIEWS_KEY);
    if (!savedList) return [];
    
    const interviewIds: string[] = JSON.parse(savedList);
    const interviews: SavedInterview[] = [];
    
    for (const id of interviewIds) {
      const interviewData = localStorage.getItem(`${INTERVIEW_PREFIX}${id}`);
      if (interviewData) {
        interviews.push(JSON.parse(interviewData));
      }
    }
    
    // Sort by savedAt date, newest first
    return interviews.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    console.error('Error getting saved interviews:', error);
    return [];
  }
};

/**
 * Save a completed interview to local storage
 */
export const saveInterviewToStorage = (interview: SavedInterview): void => {
  try {
    // Save the interview data
    localStorage.setItem(`${INTERVIEW_PREFIX}${interview.id}`, JSON.stringify(interview));
    
    // Update the list of saved interview IDs
    const existingIds = getSavedInterviewIds();
    if (!existingIds.includes(interview.id)) {
      existingIds.push(interview.id);
      localStorage.setItem(SAVED_INTERVIEWS_KEY, JSON.stringify(existingIds));
    }
    
    console.log(`Interview ${interview.id} saved successfully`);
  } catch (error) {
    console.error('Error saving interview:', error);
    throw new Error('Failed to save interview data');
  }
};

/**
 * Get saved interview IDs
 */
const getSavedInterviewIds = (): string[] => {
  try {
    const savedList = localStorage.getItem(SAVED_INTERVIEWS_KEY);
    return savedList ? JSON.parse(savedList) : [];
  } catch (error) {
    console.error('Error getting saved interview IDs:', error);
    return [];
  }
};

/**
 * Delete a saved interview from local storage
 */
export const deleteSavedInterview = (interviewId: string): void => {
  try {
    // Remove interview data
    localStorage.removeItem(`${INTERVIEW_PREFIX}${interviewId}`);
    
    // Update the list of saved interview IDs
    const existingIds = getSavedInterviewIds();
    const updatedIds = existingIds.filter(id => id !== interviewId);
    localStorage.setItem(SAVED_INTERVIEWS_KEY, JSON.stringify(updatedIds));
    
    console.log(`Interview ${interviewId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting interview:', error);
    throw new Error('Failed to delete interview data');
  }
};

/**
 * Get a specific saved interview by ID
 */
export const getSavedInterviewById = (interviewId: string): SavedInterview | null => {
  try {
    const interviewData = localStorage.getItem(`${INTERVIEW_PREFIX}${interviewId}`);
    return interviewData ? JSON.parse(interviewData) : null;
  } catch (error) {
    console.error('Error getting saved interview by ID:', error);
    return null;
  }
};

/**
 * Clear all saved interviews from local storage
 */
export const clearAllSavedInterviews = (): void => {
  try {
    const existingIds = getSavedInterviewIds();
    
    // Remove all interview data
    existingIds.forEach(id => {
      localStorage.removeItem(`${INTERVIEW_PREFIX}${id}`);
    });
    
    // Clear the list
    localStorage.removeItem(SAVED_INTERVIEWS_KEY);
    
    console.log('All saved interviews cleared successfully');
  } catch (error) {
    console.error('Error clearing saved interviews:', error);
    throw new Error('Failed to clear saved interviews');
  }
};

/**
 * Create a SavedInterview object from current candidate state
 */
export const createSavedInterviewFromState = (
  candidateState: {
    id: string | null;
    profile: CandidateProfile | null;
    interviewProgress: InterviewProgress;
    finalScore: number | null;
    summary: string | null;
    resumeFile: {
      name: string;
      size: number;
      type: string;
    } | null;
    resumeBase64: string | null;
  }
): SavedInterview | null => {
  if (!candidateState.id || !candidateState.profile) {
    return null;
  }

  return {
    id: candidateState.id,
    candidateProfile: candidateState.profile,
    interviewProgress: candidateState.interviewProgress,
    finalScore: candidateState.finalScore,
    summary: candidateState.summary,
    resumeFile: candidateState.resumeFile,
    resumeBase64: candidateState.resumeBase64,
    completedAt: candidateState.interviewProgress.completedAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
  };
};