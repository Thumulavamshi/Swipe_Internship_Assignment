import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
  education?: Array<{
    institution: string;
  }>;
  experience?: Array<{
    key: string;
    start: string;
    end: string;
    description: string[];
  }>;
  projects?: Array<{
    title: string;
    description: string[];
  }>;
  skills?: string[];
}

export interface GeneratedQuestion {
  id: number;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  expected_topics: string[];
}

export interface InterviewAnswer {
  questionId: string;
  question: string;
  answer: string;
  timestamp: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export interface InterviewProgress {
  questionIndex: number;
  answers: InterviewAnswer[];
  isComplete: boolean;
  startedAt?: string;
  completedAt?: string;
  generatedQuestions?: GeneratedQuestion[];
  scoringResults?: object; // Store detailed scoring results
}

interface CandidateState {
  id: string | null;
  profile: CandidateProfile | null;
  isProfileComplete: boolean;
  resumeFile: {
    name: string;
    size: number;
    type: string;
  } | null;
  resumePath: string | null;
  resumeText: string | null;
  resumeBase64: string | null; // Store resume as base64 for local display
  interviewProgress: InterviewProgress;
  finalScore: number | null;
  summary: string | null;
  lastUpdated: string | null;
}

const initialState: CandidateState = {
  id: null,
  profile: null,
  isProfileComplete: false,
  resumeFile: null,
  resumePath: null,
  resumeText: null,
  resumeBase64: null,
  interviewProgress: {
    questionIndex: 0,
    answers: [],
    isComplete: false,
  },
  finalScore: null,
  summary: null,
  lastUpdated: null,
};

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    setCandidateId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setProfile: (state, action: PayloadAction<CandidateProfile>) => {
      state.profile = action.payload;
      state.isProfileComplete = !!(
        action.payload.name && 
        action.payload.email && 
        action.payload.phone
      );
      state.lastUpdated = new Date().toISOString();
    },
    updateProfile: (state, action: PayloadAction<Partial<CandidateProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
        state.isProfileComplete = !!(
          state.profile.name && 
          state.profile.email && 
          state.profile.phone
        );
        state.lastUpdated = new Date().toISOString();
      }
    },
    setResumeFile: (state, action: PayloadAction<{ name: string; size: number; type: string }>) => {
      state.resumeFile = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setResumeData: (state, action: PayloadAction<{ path: string; text: string; base64?: string }>) => {
      state.resumePath = action.payload.path;
      state.resumeText = action.payload.text;
      if (action.payload.base64) {
        state.resumeBase64 = action.payload.base64;
        // Store in localStorage for persistence
        localStorage.setItem(`resume_${state.id}`, action.payload.base64);
      }
      state.lastUpdated = new Date().toISOString();
    },
    setResumeBase64: (state, action: PayloadAction<string>) => {
      state.resumeBase64 = action.payload;
      // Store in localStorage for persistence
      if (state.id) {
        localStorage.setItem(`resume_${state.id}`, action.payload);
      }
      state.lastUpdated = new Date().toISOString();
    },
    loadResumeFromStorage: (state) => {
      if (state.id) {
        const storedResume = localStorage.getItem(`resume_${state.id}`);
        if (storedResume) {
          state.resumeBase64 = storedResume;
        }
      }
    },
    startInterview: (state, action: PayloadAction<GeneratedQuestion[]>) => {
      state.interviewProgress.startedAt = new Date().toISOString();
      state.interviewProgress.questionIndex = 0;
      state.interviewProgress.answers = [];
      state.interviewProgress.isComplete = false;
      state.interviewProgress.generatedQuestions = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    addAnswer: (state, action: PayloadAction<InterviewAnswer>) => {
      state.interviewProgress.answers.push(action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    updateAnswer: (state, action: PayloadAction<{ questionId: string; answer: string }>) => {
      const existingAnswer = state.interviewProgress.answers.find(
        answer => answer.questionId === action.payload.questionId
      );
      if (existingAnswer) {
        existingAnswer.answer = action.payload.answer;
        existingAnswer.timestamp = new Date().toISOString();
      }
      state.lastUpdated = new Date().toISOString();
    },
    nextQuestion: (state) => {
      state.interviewProgress.questionIndex += 1;
      state.lastUpdated = new Date().toISOString();
    },
    completeInterview: (state, action: PayloadAction<{ score: number; summary: string; scoringResults?: object }>) => {
      state.interviewProgress.isComplete = true;
      state.interviewProgress.completedAt = new Date().toISOString();
      state.finalScore = action.payload.score;
      state.summary = action.payload.summary;
      if (action.payload.scoringResults) {
        state.interviewProgress.scoringResults = action.payload.scoringResults;
      }
      state.lastUpdated = new Date().toISOString();
    },
    clearCandidate: (state) => {
      // Clean up localStorage when clearing candidate
      if (state.id) {
        localStorage.removeItem(`resume_${state.id}`);
      }
      return { ...initialState };
    },
  },
});

export const { 
  setCandidateId,
  setProfile, 
  updateProfile, 
  setResumeFile,
  setResumeData,
  setResumeBase64,
  loadResumeFromStorage,
  startInterview,
  addAnswer,
  updateAnswer,
  nextQuestion,
  completeInterview,
  clearCandidate 
} = candidateSlice.actions;

export default candidateSlice.reducer;