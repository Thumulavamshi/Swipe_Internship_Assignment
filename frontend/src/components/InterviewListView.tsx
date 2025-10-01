import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  List, 
  Avatar, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Empty,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { getSavedInterviews, type SavedInterview } from '../utils/interviewStorage';

const { Text, Title } = Typography;
const { Search } = Input;

interface InterviewListViewProps {
  onSelectInterview: (interview: SavedInterview) => void;
}

const InterviewListView: React.FC<InterviewListViewProps> = ({ onSelectInterview }) => {
  const [savedInterviews, setSavedInterviews] = useState<SavedInterview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<SavedInterview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load saved interviews on component mount
  useEffect(() => {
    loadInterviews();
  }, []);

  // Filter interviews based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInterviews(savedInterviews);
    } else {
      const filtered = savedInterviews.filter(interview =>
        interview.candidateProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interview.candidateProfile.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInterviews(filtered);
    }
  }, [searchQuery, savedInterviews]);

  const loadInterviews = () => {
    setLoading(true);
    try {
      const interviews = getSavedInterviews();
      // Sort by score (highest first), then by completion date
      const sortedInterviews = interviews.sort((a, b) => {
        // First priority: score (highest first)
        if (a.finalScore !== null && b.finalScore !== null) {
          if (a.finalScore !== b.finalScore) {
            return b.finalScore - a.finalScore;
          }
        } else if (a.finalScore !== null) {
          return -1; // a has score, b doesn't - a comes first
        } else if (b.finalScore !== null) {
          return 1; // b has score, a doesn't - b comes first
        }
        
        // Second priority: completion date (most recent first)
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      });
      
      setSavedInterviews(sortedInterviews);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'default';
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInterviewDuration = (interview: SavedInterview) => {
    if (interview.interviewProgress.startedAt && interview.interviewProgress.completedAt) {
      const start = new Date(interview.interviewProgress.startedAt).getTime();
      const end = new Date(interview.interviewProgress.completedAt).getTime();
      const durationMinutes = Math.round((end - start) / (1000 * 60));
      return `${durationMinutes} min`;
    }
    return 'N/A';
  };

  const calculateStats = () => {
    const totalInterviews = savedInterviews.length;
    const completedInterviews = savedInterviews.filter(interview => interview.interviewProgress.isComplete).length;
    const averageScore = savedInterviews.filter(interview => interview.finalScore !== null)
      .reduce((sum, interview) => sum + (interview.finalScore || 0), 0) / 
      savedInterviews.filter(interview => interview.finalScore !== null).length || 0;
    
    return {
      total: totalInterviews,
      completed: completedInterviews,
      averageScore: Math.round(averageScore)
    };
  };

  const stats = calculateStats();

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px', 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff', marginBottom: '16px' }}>
          Interview History
        </Title>
        
        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col span={8}>
            <Statistic
              title="Total Interviews"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Average Score"
              value={stats.averageScore || 0}
              suffix="/100"
              prefix={<TrophyOutlined />}
            />
          </Col>
        </Row>

        {/* Search Bar */}
        <Search
          placeholder="Search interviews by candidate name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 400 }}
          prefix={<SearchOutlined />}
          allowClear
        />
      </div>

      {/* Interview List */}
      <Card style={{ backgroundColor: 'white' }}>
        {filteredInterviews.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchQuery ? 
                `No interviews found matching "${searchQuery}"` : 
                "No interviews available"
            }
          />
        ) : (
          <List
            loading={loading}
            itemLayout="vertical"
            size="large"
            pagination={{
              pageSize: 6,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
            dataSource={filteredInterviews}
            renderItem={(interview) => (
              <List.Item
                key={interview.id}
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#fafafa',
                }}
                className="interview-list-item"
                onClick={() => onSelectInterview(interview)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }}
                actions={[
                  <Button
                    key="view"
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectInterview(interview);
                    }}
                  >
                    View Details
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      size={64} 
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text strong style={{ fontSize: '18px' }}>
                          {interview.candidateProfile.name}
                        </Text>
                        <div style={{ marginTop: '4px' }}>
                          <Tag color={getScoreColor(interview.finalScore)}>
                            Score: {interview.finalScore !== null ? `${interview.finalScore}/100` : 'N/A'}
                          </Tag>
                          <Tag icon={<ClockCircleOutlined />}>
                            Duration: {getInterviewDuration(interview)}
                          </Tag>
                          <Tag icon={<CalendarOutlined />}>
                            {formatDate(interview.completedAt)}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: '12px' }}>
                      <Space direction="vertical" size="small">
                        <div>
                          <Text type="secondary">
                            <strong>Email:</strong> {interview.candidateProfile.email}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">
                            <strong>Phone:</strong> {interview.candidateProfile.phone}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">
                            <strong>Questions Answered:</strong> {interview.interviewProgress.answers.length}
                          </Text>
                        </div>
                        {interview.candidateProfile.skills && Array.isArray(interview.candidateProfile.skills) && interview.candidateProfile.skills.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <Text type="secondary" style={{ marginRight: '8px' }}>Skills:</Text>
                            {interview.candidateProfile.skills.slice(0, 5).map((skill, index) => (
                              <Tag key={index} style={{ fontSize: '11px', padding: '0 4px' }}>{skill}</Tag>
                            ))}
                            {interview.candidateProfile.skills.length > 5 && (
                              <Tag style={{ fontSize: '11px', padding: '0 4px' }}>+{interview.candidateProfile.skills.length - 5} more</Tag>
                            )}
                          </div>
                        )}
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default InterviewListView;