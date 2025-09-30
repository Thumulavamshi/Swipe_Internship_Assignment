import React from 'react';
import { Card, Descriptions, Tag, Space, Typography, Divider } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LinkedinOutlined, 
  GithubOutlined, 
  GlobalOutlined,
  BookOutlined,
  TeamOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import type { CandidateProfile } from '../store/candidateSlice';

const { Text } = Typography;

interface ProfileDisplayProps {
  profile: CandidateProfile | null;
  className?: string;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ profile, className }) => {
  if (!profile) {
    return (
      <Card className={className} title="Candidate Profile">
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>No profile information available</div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={className}
      title={
        <Space>
          <UserOutlined />
          Candidate Profile
        </Space>
      }
    >
      {/* Basic Information */}
      <Descriptions 
        bordered 
        size="small" 
        column={1}
        style={{ marginBottom: '20px' }}
      >
        <Descriptions.Item label={<><UserOutlined /> Name</>}>
          <Text strong>{profile.name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={<><MailOutlined /> Email</>}>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </Descriptions.Item>
        <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
          <a href={`tel:${profile.phone}`}>{profile.phone}</a>
        </Descriptions.Item>
        {profile.linkedin && (
          <Descriptions.Item label={<><LinkedinOutlined /> LinkedIn</>}>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
              View Profile
            </a>
          </Descriptions.Item>
        )}
        {profile.github && (
          <Descriptions.Item label={<><GithubOutlined /> GitHub</>}>
            <a href={profile.github} target="_blank" rel="noopener noreferrer">
              View Profile
            </a>
          </Descriptions.Item>
        )}
        {profile.website && (
          <Descriptions.Item label={<><GlobalOutlined /> Website</>}>
            <a href={profile.website} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <>
          <Divider orientation="left">Skills</Divider>
          <div style={{ marginBottom: '20px' }}>
            <Space wrap>
              {profile.skills.map((skill, index) => (
                <Tag key={index} color="blue">
                  {skill}
                </Tag>
              ))}
            </Space>
          </div>
        </>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <>
          <Divider orientation="left">
            <Space>
              <BookOutlined />
              Education
            </Space>
          </Divider>
          <div style={{ marginBottom: '20px' }}>
            {profile.education.map((edu, index) => (
              <Card 
                key={index} 
                size="small" 
                style={{ marginBottom: '8px', backgroundColor: '#fafafa' }}
              >
                <Text strong>{edu.institution}</Text>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Experience */}
      {profile.experience && profile.experience.length > 0 && (
        <>
          <Divider orientation="left">
            <Space>
              <TeamOutlined />
              Experience
            </Space>
          </Divider>
          <div style={{ marginBottom: '20px' }}>
            {profile.experience.map((exp, index) => (
              <Card 
                key={exp.key || index} 
                size="small" 
                style={{ marginBottom: '12px' }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <Space>
                    <Text strong>{exp.start}</Text>
                    <Text>-</Text>
                    <Text strong>{exp.end}</Text>
                  </Space>
                </div>
                {exp.description && exp.description.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {exp.description.map((desc, descIndex) => (
                      <li key={descIndex}>
                        <Text style={{ fontSize: '13px' }}>{desc}</Text>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Projects */}
      {profile.projects && profile.projects.length > 0 && (
        <>
          <Divider orientation="left">
            <Space>
              <ProjectOutlined />
              Projects
            </Space>
          </Divider>
          <div>
            {profile.projects.map((project, index) => (
              <Card 
                key={index} 
                size="small" 
                title={<Text strong>{project.title}</Text>}
                style={{ marginBottom: '12px' }}
              >
                {project.description && project.description.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {project.description.map((desc, descIndex) => (
                      <li key={descIndex}>
                        <Text style={{ fontSize: '13px' }}>{desc}</Text>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default ProfileDisplay;