import { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import { healthCheck } from '../api/services';

const ConnectionStatus = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await healthCheck();
        setStatus('connected');
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus('disconnected');
      }
    };

    checkConnection();
  }, []);

  if (status === 'checking') {
    return (
      <Alert
        message={<><Spin size="small" /> Checking backend connection...</>}
        type="info"
        style={{ marginBottom: '16px' }}
        showIcon={false}
      />
    );
  }

  if (status === 'disconnected') {
    return (
      <Alert
        message="Backend Disconnected"
        description="Cannot connect to backend server. Make sure it's running on http://localhost:3001"
        type="error"
        style={{ marginBottom: '16px' }}
        showIcon
      />
    );
  }

  return (
    <Alert
      message="Backend Connected"
      description="Successfully connected to backend server"
      type="success"
      style={{ marginBottom: '16px' }}
      showIcon
    />
  );
};

export default ConnectionStatus;