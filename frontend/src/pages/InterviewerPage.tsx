import React, { useEffect } from 'react';
import { Row, Col, Card, Typography, Space, Tag, Alert, Button } from 'antd';
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  TrophyOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearCandidate, loadResumeFromStorage } from '../store/candidateSlice';
import ResumeViewer from '../components/ResumeViewer';
import ProfileDisplay from '../components/ProfileDisplay';
import InterviewQADisplay from '../components/InterviewQADisplay';

const { Title, Text } = Typography;

const InterviewerPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const candidate = useAppSelector((state) => state.candidate);

  useEffect(() => {
    // Load resume from localStorage when component mounts
    if (candidate.id && !candidate.resumeBase64) {
      dispatch(loadResumeFromStorage());
    }
  }, [candidate.id, candidate.resumeBase64, dispatch]);

  const getInterviewStatus = () => {
    if (!candidate.profile) {
      return { status: 'no-candidate', color: 'default', text: 'No Active Interview' };
    }
    
    if (candidate.interviewProgress.isComplete) {
      return { status: 'completed', color: 'green', text: 'Interview Completed' };
    }
    
    if (candidate.interviewProgress.answers.length > 0) {
      return { status: 'in-progress', color: 'blue', text: 'Interview In Progress' };
    }
    
    return { status: 'ready', color: 'orange', text: 'Ready for Interview' };
  };

  const handleClearCandidate = () => {
    dispatch(clearCandidate());
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  const interviewStatus = getInterviewStatus();
  const scoringResults = candidate.interviewProgress.scoringResults as {
    overall_score: number;
    detailed_scores: Array<{
      question_id: number;
      score: number;
      feedback: string;
      strengths: string[];
      weaknesses: string[];
    }>;
    summary: string;
  } | undefined;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            Interviewer Dashboard
          </Title>
          <Text type="secondary">
            Current active interview session
          </Text>
        </div>
        <Space>
          <Tag color={interviewStatus.color} icon={
            interviewStatus.status === 'completed' ? <CheckCircleOutlined /> :
            interviewStatus.status === 'in-progress' ? <ClockCircleOutlined /> :
            <UserOutlined />
          }>
            {interviewStatus.text}
          </Tag>
          {candidate.profile && (
            <Button 
              type="default" 
              icon={<ClearOutlined />}
              onClick={handleClearCandidate}
            >
              Clear Session
            </Button>
          )}
        </Space>
      </div>

      {!candidate.profile ? (
        /* No Active Candidate */
        <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UserOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '20px' }} />
          <Title level={4} type="secondary">No Active Interview</Title>
          <Text type="secondary">
            Start an interview from the candidate page to view details here
          </Text>
        </Card>
      ) : (
        /* Active Candidate Layout */
        <Row gutter={[24, 24]}>
          {/* Left Column - Profile & Resume */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Candidate Summary Card */}
              <Card style={{ textAlign: 'center' }}>
                <Space direction="vertical" align="center">
                  <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  <Title level={4} style={{ margin: 0 }}>
                    {candidate.profile.name}
                  </Title>
                  <Text type="secondary">{candidate.profile.email}</Text>
                  {candidate.finalScore !== null && (
                    <div style={{ marginTop: '12px' }}>
                      <Space>
                        <TrophyOutlined style={{ color: '#faad14' }} />
                        <Text strong style={{ fontSize: '18px' }}>
                          Final Score: {candidate.finalScore}/100
                        </Text>
                      </Space>
                    </div>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Session started: {formatDate(candidate.interviewProgress.startedAt)}
                    </Text>
                  </div>
                </Space>
              </Card>

              {/* Resume Viewer */}
              <ResumeViewer 
                resumeBase64={candidate.resumeBase64}
                fileName={candidate.resumeFile?.name}
                fileSize={candidate.resumeFile?.size}
              />
            </Space>
          </Col>

          {/* Right Column - Profile Details & Q&A */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Profile Information */}
              <ProfileDisplay profile={candidate.profile} />

              {/* Interview Progress Alert */}
              {candidate.interviewProgress.answers.length > 0 && (
                <Alert
                  message={`Interview Progress: ${candidate.interviewProgress.answers.length} questions answered`}
                  description={
                    candidate.interviewProgress.isComplete 
                      ? `Interview completed at ${formatDate(candidate.interviewProgress.completedAt)}`
                      : `Currently on question ${candidate.interviewProgress.questionIndex + 1}`
                  }
                  type={candidate.interviewProgress.isComplete ? "success" : "info"}
                  showIcon
                />
              )}

              {/* Q&A Display */}
              <InterviewQADisplay 
                answers={candidate.interviewProgress.answers}
                scoringResults={scoringResults}
                isInterviewComplete={candidate.interviewProgress.isComplete}
              />

              {/* Summary Card */}
              {candidate.summary && (
                <Card 
                  title={
                    <Space>
                      <TrophyOutlined />
                      Interview Summary
                    </Space>
                  }
                  style={{ backgroundColor: '#f6ffed' }}
                >
                  <Text>{candidate.summary}</Text>
                </Card>
              )}
            </Space>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default InterviewerPage;