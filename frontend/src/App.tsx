import { useEffect, useState } from 'react';
import { Layout, Tabs } from 'antd';
import IntervieweePage from './pages/IntervieweePage';
import InterviewerPage from './pages/InterviewerPage';
import WelcomeBackModal from './components/WelcomeBackModal';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { setCurrentTab } from './store/sessionSlice';
import './App.css';

const { Header, Content } = Layout;

function App() {
  const dispatch = useAppDispatch();
  const candidate = useAppSelector((state) => state.candidate);
  const session = useAppSelector((state) => state.session);
  const [activeTab, setActiveTab] = useState<string>(session.currentTab);

  // Check for unfinished session on app load
  useEffect(() => {
    const hasUnfinished = session.hasUnfinishedSession && 
                         candidate.id && 
                         !session.welcomeBackShown &&
                         !candidate.interviewProgress.isComplete;
    
    if (hasUnfinished) {
      // Small delay to ensure the app is fully loaded
      setTimeout(() => {
        setShowWelcomeBack(true);
      }, 1000);
    }
  }, [session.hasUnfinishedSession, candidate.id, session.welcomeBackShown, candidate.interviewProgress.isComplete]);

  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const handleResumeInterview = () => {
    setShowWelcomeBack(false);
    setActiveTab('interviewee');
    dispatch(setCurrentTab('interviewee'));
  };

  const handleDiscardSession = () => {
    setShowWelcomeBack(false);
    setActiveTab('interviewee');
    dispatch(setCurrentTab('interviewee'));
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    dispatch(setCurrentTab(key as 'interviewee' | 'interviewer'));
  };

  const tabItems = [
    {
      key: 'interviewee',
      label: 'Interviewee',
      children: <IntervieweePage />,
    },
    {
      key: 'interviewer',
      label: 'Interviewer',
      children: <InterviewerPage />,
    },
  ];

  return (
    <div className="app">
      <WelcomeBackModal
        visible={showWelcomeBack}
        onResume={handleResumeInterview}
        onDiscard={handleDiscardSession}
      />
      
      <Layout style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
        <Header 
          style={{ 
            backgroundColor: '#0B3D91', 
            borderBottom: '4px solid #1E90FF',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
            Interview Platform
          </h1>
        </Header>
        <Content style={{ 
          padding: '24px', 
          height: 'calc(100vh - 68px)', 
          overflow: 'auto',
          flex: 1
        }}>
          <Tabs 
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            size="large"
            style={{ height: '100%' }}
          />
        </Content>
      </Layout>
    </div>
  );
}

export default App;
