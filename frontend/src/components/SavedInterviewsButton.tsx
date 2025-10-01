import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Typography, Tag, Space, Popconfirm, message } from 'antd';
import { HistoryOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { getSavedInterviews, deleteSavedInterview, type SavedInterview } from '../utils/interviewStorage';


const { Title, Text } = Typography;

interface SavedInterviewsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SavedInterviewsModal: React.FC<SavedInterviewsModalProps> = ({ visible, onClose }) => {
  const [savedInterviews, setSavedInterviews] = useState<SavedInterview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<SavedInterview | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load saved interviews when modal opens
  useEffect(() => {
    if (visible) {
      loadSavedInterviews();
    }
  }, [visible]);

  const loadSavedInterviews = () => {
    setLoading(true);
    try {
      const interviews = getSavedInterviews();
      setSavedInterviews(interviews);
    } catch (error) {
      console.error('Error loading saved interviews:', error);
      message.error('Failed to load saved interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    try {
      deleteSavedInterview(interviewId);
      setSavedInterviews(prev => prev.filter(interview => interview.id !== interviewId));
      message.success('Interview deleted successfully');
    } catch (error) {
      console.error('Error deleting interview:', error);
      message.error('Failed to delete interview');
    }
  };

  const handleViewDetails = (interview: SavedInterview) => {
    setSelectedInterview(interview);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'default';
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const columns = [
    {
      title: 'Candidate Name',
      dataIndex: ['candidateProfile', 'name'],
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Email',
      dataIndex: ['candidateProfile', 'email'],
      key: 'email',
    },
    {
      title: 'Score',
      dataIndex: 'finalScore',
      key: 'score',
      render: (score: number | null) => (
        <Tag color={getScoreColor(score)}>
          {score !== null ? `${score}/100` : 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Questions Answered',
      dataIndex: ['interviewProgress', 'answers'],
      key: 'questions',
      render: (answers: unknown[]) => (Array.isArray(answers) ? answers.length : 0),
    },
    {
      title: 'Completed At',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SavedInterview) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Popconfirm
            title="Delete Interview"
            description="Are you sure you want to delete this interview?"
            onConfirm={() => handleDeleteInterview(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryOutlined />
            <span>Saved Interviews ({savedInterviews.length})</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
        width={1000}
        style={{ top: 20 }}
      >
        <Table
          dataSource={savedInterviews}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          scroll={{ y: 400 }}
        />
      </Modal>

      {/* Interview Details Modal */}
      <Modal
        title={`Interview Details - ${selectedInterview?.candidateProfile.name}`}
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedInterview && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>Candidate Information</Title>
              <p><strong>Name:</strong> {selectedInterview.candidateProfile.name}</p>
              <p><strong>Email:</strong> {selectedInterview.candidateProfile.email}</p>
              <p><strong>Phone:</strong> {selectedInterview.candidateProfile.phone}</p>
              {selectedInterview.candidateProfile.linkedin && (
                <p><strong>LinkedIn:</strong> {selectedInterview.candidateProfile.linkedin}</p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>Interview Results</Title>
              <p><strong>Final Score:</strong> 
                <Tag color={getScoreColor(selectedInterview.finalScore)} style={{ marginLeft: '8px' }}>
                  {selectedInterview.finalScore !== null ? `${selectedInterview.finalScore}/100` : 'N/A'}
                </Tag>
              </p>
              <p><strong>Questions Answered:</strong> {selectedInterview.interviewProgress.answers.length}</p>
              <p><strong>Interview Duration:</strong> {
                selectedInterview.interviewProgress.startedAt && selectedInterview.interviewProgress.completedAt
                  ? Math.round((new Date(selectedInterview.interviewProgress.completedAt).getTime() - new Date(selectedInterview.interviewProgress.startedAt).getTime()) / (1000 * 60))
                  : 'N/A'
              } minutes</p>
              <p><strong>Completed At:</strong> {formatDate(selectedInterview.completedAt)}</p>
            </div>

            {selectedInterview.summary && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Summary</Title>
                <p>{selectedInterview.summary}</p>
              </div>
            )}

            {selectedInterview.candidateProfile.skills && Array.isArray(selectedInterview.candidateProfile.skills) && selectedInterview.candidateProfile.skills.length > 0 && (
              <div>
                <Title level={4}>Skills</Title>
                <div>
                  {selectedInterview.candidateProfile.skills.map((skill, index) => (
                    <Tag key={index} style={{ marginBottom: '4px' }}>
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

// Button component to trigger the modal
const SavedInterviewsButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* <Button
        icon={<HistoryOutlined />}
        onClick={() => setShowModal(true)}
        style={{ marginLeft: '8px' }}
      >
        View History
      </Button> */}
      <SavedInterviewsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default SavedInterviewsButton;