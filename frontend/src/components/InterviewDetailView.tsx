import React from 'react';
import { Row, Col, Card, Typography, Space, Tag, Alert, Button } from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined,
  TrophyOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import ResumeViewer from './ResumeViewer';
import ProfileDisplay from './ProfileDisplay';
import InterviewQADisplay from './InterviewQADisplay';
import type { SavedInterview } from '../utils/interviewStorage';

const { Title, Text } = Typography;

interface InterviewDetailViewProps {
  interview: SavedInterview;
  onBack: () => void;
}

const InterviewDetailView: React.FC<InterviewDetailViewProps> = ({ interview, onBack }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  const scoringResults = interview.interviewProgress.scoringResults as {
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
          <Space>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ marginRight: '12px' }}
            >
              Back to List
            </Button>
            <div>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                Interview Details - {interview.candidateProfile.name}
              </Title>
              <Text type="secondary">
                Completed on {formatDate(interview.completedAt)}
              </Text>
            </div>
          </Space>
        </div>
        <Space>
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Interview Completed
          </Tag>
        </Space>
      </div>

      {/* Active Candidate Layout */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Profile & Resume */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Candidate Summary Card */}
            <Card style={{ textAlign: 'center' }}>
              <Space direction="vertical" align="center">
                <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>
                  {interview.candidateProfile.name}
                </Title>
                <Text type="secondary">{interview.candidateProfile.email}</Text>
                {interview.finalScore !== null && (
                  <div style={{ marginTop: '12px' }}>
                    <Space>
                      <TrophyOutlined style={{ color: '#faad14' }} />
                      <Text strong style={{ fontSize: '18px' }}>
                        Final Score: {interview.finalScore}/100
                      </Text>
                    </Space>
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Session started: {formatDate(interview.interviewProgress.startedAt)}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Duration: {
                      interview.interviewProgress.startedAt && interview.interviewProgress.completedAt
                        ? Math.round(
                            (new Date(interview.interviewProgress.completedAt).getTime() - 
                             new Date(interview.interviewProgress.startedAt).getTime()) / (1000 * 60)
                          ) + ' minutes'
                        : 'N/A'
                    }
                  </Text>
                </div>
              </Space>
            </Card>

            {/* Resume Viewer */}
            <ResumeViewer 
              resumeBase64={interview.resumeBase64}
              fileName={interview.resumeFile?.name}
              fileSize={interview.resumeFile?.size}
            />
          </Space>
        </Col>

        {/* Right Column - Profile Details & Q&A */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Profile Information */}
            <ProfileDisplay profile={interview.candidateProfile} />

            {/* Interview Progress Alert */}
            <Alert
              message={`Interview Completed: ${interview.interviewProgress.answers.length} questions answered`}
              description={`Interview completed at ${formatDate(interview.interviewProgress.completedAt)}`}
              type="success"
              showIcon
            />

            {/* Q&A Display */}
            <InterviewQADisplay 
              answers={interview.interviewProgress.answers}
              scoringResults={scoringResults}
              isInterviewComplete={interview.interviewProgress.isComplete}
            />

            {/* Summary Card */}
            {interview.summary && (
              <Card 
                title={
                  <Space>
                    <TrophyOutlined />
                    Interview Summary
                  </Space>
                }
                style={{ backgroundColor: '#f6ffed' }}
              >
                <Text>{interview.summary}</Text>
              </Card>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default InterviewDetailView;