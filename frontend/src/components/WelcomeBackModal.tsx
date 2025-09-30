import { Modal, Button, Typography, Space, Card } from 'antd';
import { HomeOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearCandidate } from '../store/candidateSlice';
import { clearSession, setWelcomeBackShown, setCurrentTab } from '../store/sessionSlice';

const { Title, Paragraph, Text } = Typography;

interface WelcomeBackModalProps {
  visible: boolean;
  onResume: () => void;
  onDiscard: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({ visible, onResume, onDiscard }) => {
  const dispatch = useAppDispatch();
  const candidate = useAppSelector((state) => state.candidate);
  const session = useAppSelector((state) => state.session);

  const handleResume = () => {
    dispatch(setWelcomeBackShown(true));
    dispatch(setCurrentTab('interviewee'));
    onResume();
  };

  const handleDiscard = () => {
    dispatch(clearCandidate());
    dispatch(clearSession());
    dispatch(setWelcomeBackShown(true));
    onDiscard();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const getProgressText = () => {
    if (!candidate.interviewProgress) return 'No progress';
    
    const { questionIndex, answers, isComplete } = candidate.interviewProgress;
    
    if (isComplete) {
      return `Interview completed with ${answers.length} questions answered`;
    }
    
    if (answers.length === 0) {
      return 'Interview not started';
    }
    
    return `${answers.length} questions answered, currently on question ${questionIndex + 1}`;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HomeOutlined style={{ color: '#1890ff' }} />
          <span>Welcome Back!</span>
        </div>
      }
      open={visible}
      footer={null}
      closable={false}
      width={600}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <Paragraph>
          We found an unfinished interview session. Would you like to continue where you left off?
        </Paragraph>

        <Card style={{ marginBottom: '24px', backgroundColor: '#f8f9fa' }}>
          <Title level={5} style={{ margin: '0 0 12px 0' }}>
            Previous Session Details
          </Title>
          
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Text strong>Candidate: </Text>
              <Text>{candidate.profile?.name || 'Unknown'}</Text>
            </div>
            
            <div>
              <Text strong>Email: </Text>
              <Text>{candidate.profile?.email || 'Not provided'}</Text>
            </div>
            
            <div>
              <Text strong>Resume: </Text>
              <Text>{candidate.resumeFile?.name || 'Not uploaded'}</Text>
            </div>
            
            <div>
              <Text strong>Progress: </Text>
              <Text>{getProgressText()}</Text>
            </div>
            
            <div>
              <Text strong>Last Activity: </Text>
              <Text type="secondary">{formatDate(session.lastActivity)}</Text>
            </div>
          </Space>
        </Card>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleResume}
            style={{ minWidth: '140px' }}
          >
            Resume Interview
          </Button>
          
          <Button
            danger
            size="large"
            icon={<DeleteOutlined />}
            onClick={handleDiscard}
            style={{ minWidth: '140px' }}
          >
            Start Fresh
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Your progress is automatically saved locally in your browser
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;