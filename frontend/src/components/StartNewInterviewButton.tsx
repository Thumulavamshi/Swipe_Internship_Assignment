import React, { useState } from 'react';
import { Button, Modal, message } from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { startNewInterview } from '../store/candidateSlice';
import { startNewSession } from '../store/sessionSlice';
import { saveInterviewToStorage, createSavedInterviewFromState } from '../utils/interviewStorage';

interface StartNewInterviewButtonProps {
  disabled?: boolean;
}

const StartNewInterviewButton: React.FC<StartNewInterviewButtonProps> = ({ disabled = false }) => {
  const dispatch = useAppDispatch();
  const candidate = useAppSelector((state) => state.candidate);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Determine if there's data to save
  const hasDataToSave = Boolean(
    candidate.id && 
    candidate.profile && 
    (candidate.interviewProgress.answers.length > 0 || candidate.resumeFile)
  );

  const handleStartNewInterview = () => {
    if (hasDataToSave) {
      setShowConfirmModal(true);
    } else {
      // No data to save, just reset
      resetInterview();
    }
  };

  const handleSaveAndReset = async () => {
    setIsSaving(true);
    try {
      // Create saved interview from current state
      const savedInterview = createSavedInterviewFromState(candidate);
      
      if (savedInterview) {
        // Save to local storage
        saveInterviewToStorage(savedInterview);
        
        message.success(`Interview for ${candidate.profile?.name} saved successfully!`);
      }
      
      // Reset the interview
      resetInterview();
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error saving interview:', error);
      message.error('Failed to save interview data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardAndReset = () => {
    resetInterview();
    setShowConfirmModal(false);
    message.info('Current interview data discarded. Starting fresh!');
  };

  const resetInterview = () => {
    // Reset both candidate and session state
    dispatch(startNewInterview());
    dispatch(startNewSession());
  };

  const candidateName = candidate.profile?.name || 'Unknown';
  const hasCompletedInterview = candidate.interviewProgress.isComplete;
  const totalAnswers = candidate.interviewProgress.answers.length;

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleStartNewInterview}
        disabled={disabled}
        size="large"
        style={{
          background: hasDataToSave ? '#1890ff' : '#52c41a',
          borderColor: hasDataToSave ? '#1890ff' : '#52c41a',
        }}
      >
        Start New Interview
      </Button>

      <Modal
        title="Start New Interview"
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <p>
            <strong>Current Interview Data:</strong>
          </p>
          <ul style={{ marginBottom: '20px' }}>
            <li><strong>Candidate:</strong> {candidateName}</li>
            {candidate.resumeFile && (
              <li><strong>Resume:</strong> {candidate.resumeFile.name}</li>
            )}
            <li><strong>Questions Answered:</strong> {totalAnswers}</li>
            <li><strong>Status:</strong> {hasCompletedInterview ? 'Completed' : 'In Progress'}</li>
            {candidate.finalScore && (
              <li><strong>Final Score:</strong> {candidate.finalScore}/100</li>
            )}
          </ul>
          
          <p>
            What would you like to do with the current interview data before starting a new one?
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            
            <Button
              type="default"
              danger
              onClick={handleDiscardAndReset}
              disabled={isSaving}
            >
              Discard & Start New
            </Button>
            
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveAndReset}
              loading={isSaving}
            >
              Save & Start New
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default StartNewInterviewButton;