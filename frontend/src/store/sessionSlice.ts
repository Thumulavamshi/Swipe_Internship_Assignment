import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  lastActiveCandidateId: string | null;
  hasUnfinishedSession: boolean;
  welcomeBackShown: boolean;
  currentTab: 'interviewee' | 'interviewer';
  lastActivity: string | null;
}

const initialState: SessionState = {
  lastActiveCandidateId: null,
  hasUnfinishedSession: false,
  welcomeBackShown: false,
  currentTab: 'interviewee',
  lastActivity: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setLastActiveCandidateId: (state, action: PayloadAction<string>) => {
      state.lastActiveCandidateId = action.payload;
      state.hasUnfinishedSession = true;
      state.lastActivity = new Date().toISOString();
    },
    setWelcomeBackShown: (state, action: PayloadAction<boolean>) => {
      state.welcomeBackShown = action.payload;
    },
    setCurrentTab: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.currentTab = action.payload;
      state.lastActivity = new Date().toISOString();
    },
    completeSession: (state) => {
      state.hasUnfinishedSession = false;
      state.lastActivity = new Date().toISOString();
    },
    clearSession: () => {
      return { ...initialState };
    },
  },
});

export const { 
  setLastActiveCandidateId,
  setWelcomeBackShown,
  setCurrentTab,
  completeSession,
  clearSession 
} = sessionSlice.actions;

export default sessionSlice.reducer;