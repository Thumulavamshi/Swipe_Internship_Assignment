import React, { useState } from 'react';
import InterviewListView from '../components/InterviewListView';
import InterviewDetailView from '../components/InterviewDetailView';
import type { SavedInterview } from '../utils/interviewStorage';

const InterviewerPage: React.FC = () => {
  const [selectedInterview, setSelectedInterview] = useState<SavedInterview | null>(null);

  const handleSelectInterview = (interview: SavedInterview) => {
    setSelectedInterview(interview);
  };

  const handleBackToList = () => {
    setSelectedInterview(null);
  };

  // Show detailed view if an interview is selected, otherwise show the list
  if (selectedInterview) {
    return (
      <InterviewDetailView 
        interview={selectedInterview} 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <InterviewListView onSelectInterview={handleSelectInterview} />
  );
};

export default InterviewerPage;