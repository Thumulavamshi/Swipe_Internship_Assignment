import React from 'react';
import { Card, Button, Typography, Space, Alert } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ResumeViewerProps {
  resumeBase64?: string | null;
  fileName?: string;
  fileSize?: number;
  className?: string;
}

const ResumeViewer: React.FC<ResumeViewerProps> = ({
  resumeBase64,
  fileName = "resume.pdf",
  fileSize,
  className
}) => {
  const handleDownload = () => {
    if (!resumeBase64) return;
    
    try {
      const linkSource = `data:application/pdf;base64,${resumeBase64}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  if (!resumeBase64) {
    return (
      <Card className={className}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <div style={{ marginTop: '16px', color: '#999' }}>
            No resume uploaded
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={className}
      title={
        <Space>
          <FileTextOutlined />
          <span>Resume</span>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          size="small"
          onClick={handleDownload}
        >
          Download
        </Button>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Text strong>{fileName}</Text>
        {fileSize && (
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            ({formatFileSize(fileSize)})
          </Text>
        )}
      </div>

      <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', overflow: 'hidden' }}>
        <iframe
          src={`data:application/pdf;base64,${resumeBase64}`}
          style={{
            width: '100%',
            height: '400px',
            border: 'none',
          }}
          title="Resume Preview"
        />
      </div>

      <Alert
        message="Resume Preview"
        description="If the preview doesn't load properly, click Download to view the full resume."
        type="info"
        showIcon
        style={{ marginTop: '12px' }}
      />
    </Card>
  );
};

export default ResumeViewer;