import { useState } from 'react';
import { Upload, Button, Card, Form, Input, Space, message, Alert, Tag, Typography } from 'antd';
import { UploadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LinkOutlined, PhoneOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCandidateId, setProfile, setResumeFile, setResumeData, clearCandidate } from '../store/candidateSlice';
import { setLastActiveCandidateId } from '../store/sessionSlice';
import type { CandidateProfile } from '../store/candidateSlice';
import { uploadResume } from '../api/services';

const { Text } = Typography;

interface ResumeUploadProps {
  onStartInterview?: () => void;
}

const ResumeUpload = ({ onStartInterview }: ResumeUploadProps = {}) => {
  const dispatch = useAppDispatch();
  const candidateState = useAppSelector((state) => state.candidate);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const validateMandatoryFields = (profile: CandidateProfile) => {
    const missing = [];
    if (!profile.name || profile.name.trim() === '') missing.push('name');
    if (!profile.email || profile.email.trim() === '') missing.push('email');
    if (!profile.phone || profile.phone.trim() === '') missing.push('phone');
    return missing;
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      setUploading(true);
      
      // Convert file to base64 for local storage
      const base64 = await fileToBase64(file as File);
      
      // Call resume parsing API
      const response = await uploadResume(file as File);
      
      // Store in Redux
      dispatch(setCandidateId(response.candidateId));
      dispatch(setProfile(response.extracted));
      dispatch(setResumeFile({
        name: response.fileName,
        size: response.fileSize,
        type: (file as File).type
      }));
      dispatch(setResumeData({
        path: response.fileName,
        text: response.resumeText,
        base64: base64
      }));
      
      // Track this as an active session
      dispatch(setLastActiveCandidateId(response.candidateId));
      
      setUploadedFile(file as UploadFile);
      
      // Set form values
      form.setFieldsValue(response.extracted);
      
      // Process the extracted data
      
      // Check for missing mandatory fields
      const missing = validateMandatoryFields(response.extracted);
      setMissingFields(missing);
      
      if (missing.length > 0) {
        message.warning(`Please fill in the missing mandatory fields: ${missing.join(', ')}`);
      } else {
        message.success('Resume uploaded and processed successfully!');
      }
      
      onSuccess?.(response);
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to process resume';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      }
      message.error(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file: UploadFile) => {
    const isValidType = file.type === 'application/pdf' || 
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (!isValidType) {
      message.error('Please upload only PDF or DOCX files!');
      return false;
    }

    const isLt5M = (file.size || 0) / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
      return false;
    }

    return true;
  };

  const handleSaveProfile = async (values: CandidateProfile) => {
    try {
      // Check for missing mandatory fields
      const missing = validateMandatoryFields(values);
      setMissingFields(missing);
      
      if (missing.length > 0) {
        message.error(`Please fill in the missing mandatory fields: ${missing.join(', ')}`);
        return;
      }
      
      // Save to Redux store
      dispatch(setProfile(values));
      message.success('Profile saved successfully!');
    } catch {
      message.error('Failed to save profile');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    dispatch(clearCandidate());
    setMissingFields([]);
    form.resetFields();
  };

  return (
    <div style={{ width: '100%' }}>
      <Card title="Resume Upload" style={{ marginBottom: '24px' }}>
        {!uploadedFile ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Upload
              accept=".pdf,.docx"
              showUploadList={false}
              customRequest={handleUpload}
              beforeUpload={beforeUpload}
              maxCount={1}
            >
              <div style={{
                border: '2px dashed #d9d9d9',
                borderRadius: '8px',
                padding: '40px',
                backgroundColor: '#fafafa',
                cursor: 'pointer',
                transition: 'border-color 0.3s'
              }}>
                <UploadOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  Click or drag file to upload
                </p>
                <p style={{ color: '#888', margin: 0 }}>
                  Supported formats: PDF, DOCX (Max 5MB)
                </p>
              </div>
            </Upload>
          </div>
        ) : (
          <div>
            <Alert
              message="Resume Uploaded Successfully"
              description={`File: ${uploadedFile.name}`}
              type="success"
              icon={<CheckCircleOutlined />}
              action={
                <Button size="small" type="link" onClick={handleRemoveFile}>
                  Remove
                </Button>
              }
              style={{ marginBottom: '16px' }}
            />
          </div>
        )}

        {uploading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div>Processing resume...</div>
          </div>
        )}
      </Card>

      {candidateState.profile && (
        <Card title="Extracted Profile Information">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveProfile}
            initialValues={candidateState.profile}
          >
            {/* Mandatory Fields Section */}
            <div style={{ marginBottom: '24px' }}>
              <Typography.Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
                <UserOutlined /> Personal Information (Required)
              </Typography.Title>
              
              {missingFields.length > 0 && (
                <Alert
                  message="Missing Required Information"
                  description={`Please fill in the following mandatory fields: ${missingFields.join(', ')}`}
                  type="error"
                  icon={<ExclamationCircleOutlined />}
                  style={{ marginBottom: '16px' }}
                />
              )}

              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
                validateStatus={missingFields.includes('name') ? 'error' : ''}
                hasFeedback={missingFields.includes('name')}
              >
                <Input 
                  size="large" 
                  prefix={<UserOutlined />}
                  style={{ borderColor: missingFields.includes('name') ? '#ff4d4f' : undefined }}
                />
              </Form.Item>

              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
                validateStatus={missingFields.includes('email') ? 'error' : ''}
                hasFeedback={missingFields.includes('email')}
              >
                <Input 
                  size="large" 
                  prefix={<MailOutlined />}
                  style={{ borderColor: missingFields.includes('email') ? '#ff4d4f' : undefined }}
                />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
                validateStatus={missingFields.includes('phone') ? 'error' : ''}
                hasFeedback={missingFields.includes('phone')}
              >
                <Input 
                  size="large" 
                  prefix={<PhoneOutlined />}
                  placeholder="Enter your phone number"
                  style={{ borderColor: missingFields.includes('phone') ? '#ff4d4f' : undefined }}
                />
              </Form.Item>
            </div>

            {/* Optional Fields Section */}
            {(candidateState.profile.linkedin || candidateState.profile.github || candidateState.profile.website) && (
              <div style={{ marginBottom: '24px' }}>
                <Typography.Title level={4} style={{ marginBottom: '16px' }}>
                  <LinkOutlined /> Links
                </Typography.Title>
                
                {candidateState.profile.linkedin && (
                  <Form.Item label="LinkedIn" name="linkedin">
                    <Input size="large" prefix={<LinkOutlined />} />
                  </Form.Item>
                )}
                
                {candidateState.profile.github && (
                  <Form.Item label="GitHub" name="github">
                    <Input size="large" prefix={<LinkOutlined />} />
                  </Form.Item>
                )}
                
                {candidateState.profile.website && (
                  <Form.Item label="Website" name="website">
                    <Input size="large" prefix={<LinkOutlined />} />
                  </Form.Item>
                )}
              </div>
            )}

            {/* Education Section */}
            {candidateState.profile.education && candidateState.profile.education.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Typography.Title level={4} style={{ marginBottom: '16px' }}>
                  Education
                </Typography.Title>
                {candidateState.profile.education.map((edu, index) => (
                  <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                    <Text strong>{edu.institution}</Text>
                  </Card>
                ))}
              </div>
            )}

            {/* Experience Section */}
            {candidateState.profile.experience && candidateState.profile.experience.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Typography.Title level={4} style={{ marginBottom: '16px' }}>
                  Experience ({candidateState.profile.experience.length} items)
                </Typography.Title>
                {candidateState.profile.experience.map((exp, index) => {

                  return (
                    <Card key={index} size="small" style={{ marginBottom: '12px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text strong>{exp.key}</Text>
                        {exp.start && (
                          <Text type="secondary" style={{ marginLeft: '12px' }}>
                            {exp.start} {exp.end && exp.end !== 'not found' ? `- ${exp.end}` : '- Present'}
                          </Text>
                        )}
                      </div>
                      {exp.description && exp.description.length > 0 && (
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          {exp.description.map((desc, descIndex) => (
                            <li key={descIndex} style={{ marginBottom: '4px' }}>
                              <Text>{desc}</Text>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Projects Section */}
            {candidateState.profile.projects && candidateState.profile.projects.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Typography.Title level={4} style={{ marginBottom: '16px' }}>
                  Projects
                </Typography.Title>
                {candidateState.profile.projects.map((project, index) => (
                  <Card key={index} size="small" style={{ marginBottom: '12px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>{project.title}</Text>
                    </div>
                    {project.description && project.description.length > 0 && (
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {project.description.map((desc, descIndex) => (
                          <li key={descIndex} style={{ marginBottom: '4px' }}>
                            <Text>{desc}</Text>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Skills Section */}
            {candidateState.profile.skills && candidateState.profile.skills.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Typography.Title level={4} style={{ marginBottom: '16px' }}>
                  Skills
                </Typography.Title>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {candidateState.profile.skills.map((skill, index) => (
                    <Tag key={index} color="blue">
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size="large"
                  disabled={missingFields.length > 0}
                >
                  {missingFields.length > 0 ? 'Complete Required Fields' : 'Save Profile'}
                </Button>
                {missingFields.length === 0 && candidateState.isProfileComplete && (
                  <Button 
                    size="large" 
                    type="default"
                    onClick={onStartInterview}
                  >
                    Start Interview
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default ResumeUpload;