import { useState } from 'react';
import { Tabs } from 'antd';
import ResumeUpload from '../components/ResumeUpload';
import InterviewChat from '../components/InterviewChat';
import { useAppSelector } from '../store/hooks';

const IntervieweePage = () => {
  const candidate = useAppSelector((state) => state.candidate);
  const [activeTab, setActiveTab] = useState('resume');

  // Auto-switch to interview tab when profile is complete
  const handleInterviewComplete = (score: number, summary: string) => {
    console.log('Interview completed:', { score, summary });
  };

  const handleStartInterview = () => {
    setActiveTab('interview');
  };

  const tabItems = [
    {
      key: 'resume',
      label: 'Resume Upload',
      children: <ResumeUpload onStartInterview={handleStartInterview} />,
    },
    {
      key: 'interview',
      label: 'Interview',
      disabled: !candidate.isProfileComplete,
      children: <InterviewChat onInterviewComplete={handleInterviewComplete} />,
    }
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default IntervieweePage;