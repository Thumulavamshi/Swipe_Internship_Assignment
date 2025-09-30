import React from 'react';
import { Card, Timeline, Tag, Progress, Typography, Space, Badge } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  MessageOutlined 
} from '@ant-design/icons';
import type { InterviewAnswer } from '../store/candidateSlice';

const { Text, Paragraph } = Typography;

interface QuestionScore {
  question_id: number;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

interface InterviewQADisplayProps {
  answers: InterviewAnswer[];
  scoringResults?: {
    overall_score: number;
    detailed_scores: QuestionScore[];
    summary: string;
  };
  isInterviewComplete: boolean;
  className?: string;
}

const InterviewQADisplay: React.FC<InterviewQADisplayProps> = ({
  answers,
  scoringResults,
  isInterviewComplete,
  className
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const formatDuration = (timestamp: string, previousTimestamp?: string) => {
    if (!previousTimestamp) return '';
    const current = new Date(timestamp).getTime();
    const previous = new Date(previousTimestamp).getTime();
    const seconds = Math.floor((current - previous) / 1000);
    return `${seconds}s`;
  };

  const getQuestionScore = (questionId: string) => {
    if (!scoringResults?.detailed_scores) return null;
    return scoringResults.detailed_scores.find(
      score => score.question_id === parseInt(questionId)
    );
  };

  if (answers.length === 0) {
    return (
      <Card className={className} title="Interview Q&A">
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <MessageOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>No questions answered yet</div>
        </div>
      </Card>
    );
  }

  const timelineItems = answers.map((answer, index) => {
    const questionScore = getQuestionScore(answer.questionId);
    const duration = index > 0 ? formatDuration(answer.timestamp, answers[index - 1]?.timestamp) : '';

    return {
      dot: questionScore ? (
        <Badge count={Math.round(questionScore.score)} style={{ backgroundColor: getScoreColor(questionScore.score) }}>
          <CheckCircleOutlined style={{ fontSize: '16px', color: getScoreColor(questionScore.score) }} />
        </Badge>
      ) : (
        <ClockCircleOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
      ),
      children: (
        <div style={{ marginBottom: '20px' }}>
          {/* Question Header */}
          <div style={{ marginBottom: '12px' }}>
            <Space wrap>
              <Text strong>Q{index + 1}:</Text>
              <Tag color={getDifficultyColor(answer.difficulty)}>
                {answer.difficulty.toUpperCase()}
              </Tag>
              <Tag>{answer.category}</Tag>
              {duration && (
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {duration}
                </Tag>
              )}
            </Space>
          </div>

          {/* Question */}
          <Paragraph style={{ marginBottom: '12px', fontWeight: 500 }}>
            {answer.question}
          </Paragraph>

          {/* Answer */}
          <Card size="small" style={{ backgroundColor: '#fafafa', marginBottom: '12px' }}>
            <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {answer.answer}
            </Paragraph>
          </Card>

          {/* Scoring Details */}
          {questionScore && (
            <Card 
              size="small" 
              style={{ 
                borderLeft: `4px solid ${getScoreColor(questionScore.score)}`,
                marginTop: '8px'
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <Space>
                  <Text strong>Score:</Text>
                  <Progress 
                    percent={questionScore.score} 
                    size="small" 
                    strokeColor={getScoreColor(questionScore.score)}
                    style={{ width: '100px' }}
                  />
                  <Text style={{ color: getScoreColor(questionScore.score), fontWeight: 'bold' }}>
                    {Math.round(questionScore.score)}/100
                  </Text>
                </Space>
              </div>

              {questionScore.feedback && (
                <Paragraph style={{ margin: '8px 0', fontSize: '13px' }}>
                  <Text type="secondary">{questionScore.feedback}</Text>
                </Paragraph>
              )}

              {questionScore.strengths && questionScore.strengths.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <Text strong style={{ fontSize: '12px', color: '#52c41a' }}>Strengths: </Text>
                  <Text style={{ fontSize: '12px' }}>
                    {questionScore.strengths.join(', ')}
                  </Text>
                </div>
              )}

              {questionScore.weaknesses && questionScore.weaknesses.length > 0 && (
                <div>
                  <Text strong style={{ fontSize: '12px', color: '#ff4d4f' }}>Areas for improvement: </Text>
                  <Text style={{ fontSize: '12px' }}>
                    {questionScore.weaknesses.join(', ')}
                  </Text>
                </div>
              )}
            </Card>
          )}
        </div>
      ),
    };
  });

  return (
    <Card 
      className={className}
      title={
        <Space>
          <MessageOutlined />
          Interview Q&A
          {isInterviewComplete && (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Completed
            </Tag>
          )}
        </Space>
      }
      extra={
        scoringResults && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Overall Score</div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: getScoreColor(scoringResults.overall_score) 
            }}>
              {Math.round(scoringResults.overall_score)}/100
            </div>
          </div>
        )
      }
    >
      <Timeline items={timelineItems} />
      
      {scoringResults?.summary && (
        <Card 
          size="small" 
          title="Interview Summary" 
          style={{ marginTop: '16px', backgroundColor: '#f6ffed' }}
        >
          <Paragraph style={{ margin: 0 }}>
            {scoringResults.summary}
          </Paragraph>
        </Card>
      )}
    </Card>
  );
};

export default InterviewQADisplay;