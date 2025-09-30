import { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Progress, Typography, Space, message, Tag, Tabs } from 'antd';
import { SendOutlined, ClockCircleOutlined, EditOutlined, AudioOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { addAnswer, nextQuestion, completeInterview, startInterview as startInterviewAction } from '../store/candidateSlice';
import { generateQuestions, scoreAnswers } from '../api/services';
import type { GeneratedQuestion, GenerateQuestionsResponse, ParsedResumeData, ScoringPayload } from '../api/services';
import VoiceRecorder from './VoiceRecorder';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface InterviewChatProps {
  onInterviewComplete?: (score: number, summary: string) => void;
}

const InterviewChat: React.FC<InterviewChatProps> = ({ onInterviewComplete }) => {
  const dispatch = useAppDispatch();
  const candidate = useAppSelector((state) => state.candidate);
  
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isScoringAnswers, setIsScoringAnswers] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  
  const timerRef = useRef<number | null>(null);
  const autoSubmitRef = useRef<boolean>(false);
  const answerTimesRef = useRef<number[]>([]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage (0-100)
  const getProgressPercent = (): number => {
    if (!currentQuestion) return 0;
    const timeLimit = getTimeLimit(currentQuestion.difficulty);
    return ((timeLimit - timeLeft) / timeLimit) * 100;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange'; 
      case 'hard': return 'red';
      default: return 'default';
    }
  };

  // Start timer for current question
  const startTimer = (timeLimit: number) => {
    setTimeLeft(timeLimit);
    setQuestionStartTime(Date.now());
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          autoSubmitRef.current = true;
          handleSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Stop timer
  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Get time limit based on difficulty
  const getTimeLimit = (difficulty: string): number => {
    switch (difficulty) {
      case 'easy': return 20; // 20 seconds for easy
      case 'medium': return 60; // 60 seconds for medium  
      case 'hard': return 120; // 120 seconds for hard
      default: return 60;
    }
  };

  // Start interview - generate questions and start
  const handleStartInterview = async () => {
    if (!candidate.profile || !candidate.resumeText) {
      message.error('Please upload resume first and ensure profile is complete.');
      return;
    }

    setIsGeneratingQuestions(true);
    
    try {
      // Prepare the resume data for API call - we need to convert it back to the parsed format
      const resumeData: ParsedResumeData = {
        personal_info: {
          name: candidate.profile.name || "not found",
          email: candidate.profile.email || "not found", 
          phone: candidate.profile.phone || "not found",
          linkedin: candidate.profile.linkedin || "not found",
          github: candidate.profile.github || "not found",
          website: candidate.profile.website || "not found"
        },
        other_info: {
          education: candidate.profile.education || [],
          experience: candidate.profile.experience || [],
          projects: candidate.profile.projects || [],
          extra_info: {
            skills: candidate.profile.skills || []
          }
        }
      };

      const response: GenerateQuestionsResponse = await generateQuestions(resumeData);
      
      // Initialize Redux with generated questions  
      dispatch(startInterviewAction(response.questions));
      
      // Initialize answer times array
      answerTimesRef.current = new Array(response.questions.length).fill(0);
      
      // Start with first question
      const firstQuestion = response.questions[0];
      setCurrentQuestion(firstQuestion);
      setInterviewStarted(true);
      startTimer(getTimeLimit(firstQuestion.difficulty));

      message.success('Interview started! Answer 6 questions to complete.');
    } catch (error) {
      console.error('Failed to generate questions:', error);
      message.error('Failed to start interview. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || isSubmitting || !candidate.interviewProgress?.generatedQuestions) return;

    setIsSubmitting(true);
    stopTimer();

    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      // Track time taken for potential future use
      Math.min(timeTaken, getTimeLimit(currentQuestion.difficulty));
      
      // Save the answer to Redux
      dispatch(addAnswer({
        questionId: currentQuestion.id.toString(),
        question: currentQuestion.question,
        answer: answerText,
        timestamp: new Date().toISOString(),
        difficulty: currentQuestion.difficulty,
        category: currentQuestion.category
      }));

      const currentIndex = candidate.interviewProgress.questionIndex;
      const totalQuestions = candidate.interviewProgress.generatedQuestions.length;
      
      dispatch(nextQuestion());
      
      // Store time taken for this answer
      answerTimesRef.current[currentIndex] = timeTaken;
      
      // Check if interview is complete
      if (currentIndex + 1 >= totalQuestions) {
        // Interview completed - all 6 questions done
        stopTimer();
        setCurrentQuestion(null);
        setIsScoringAnswers(true);
        
        // Prepare all answers including the current one
        const allAnswers = [...candidate.interviewProgress.answers, {
          questionId: currentQuestion.id.toString(),
          question: currentQuestion.question,
          answer: answerText,
          timestamp: new Date().toISOString(),
          difficulty: currentQuestion.difficulty,
          category: currentQuestion.category
        }];
        
        // Interview completed - prepare for scoring

        // Prepare scoring payload
        const scoringPayload: ScoringPayload = {
          candidate_info: {
            name: candidate.profile?.name || 'Unknown Candidate',
            technology: 'React.js'
          },
          interview_data: candidate.interviewProgress.generatedQuestions.map((question, index) => ({
            question_id: question.id,
            question: question.question,
            difficulty: question.difficulty,
            category: question.category,
            expected_topics: question.expected_topics,
            answer: allAnswers[index]?.answer || '',
            time_taken: answerTimesRef.current[index] || 0,
            max_time_allowed: getTimeLimit(question.difficulty)
          }))
        };

        try {
          console.log('Sending for scoring:', scoringPayload);
          message.loading('Evaluating your answers...', 0);
          
          const scoringResult = await scoreAnswers(scoringPayload);
          
          message.destroy(); // Clear loading message
          
          dispatch(completeInterview({
            score: Math.round(scoringResult.overall_score),
            summary: scoringResult.summary,
            scoringResults: scoringResult
          }));
          
          message.success(`Interview completed! Your score: ${Math.round(scoringResult.overall_score)}/100`);
          onInterviewComplete?.(
            Math.round(scoringResult.overall_score), 
            scoringResult.summary
          );
        } catch (error) {
          console.error('Failed to score answers:', error);
          message.destroy(); // Clear loading message
          message.warning('Interview completed but scoring failed. Using fallback score.');
          
          // Fallback scoring - calculate basic score based on answer length and question count
          const averageAnswerLength = allAnswers.reduce((sum, answer) => sum + answer.answer.length, 0) / allAnswers.length;
          const baseScore = Math.min(100, Math.max(0, (averageAnswerLength / 50) * 60 + 20)); // Basic scoring logic
          
          dispatch(completeInterview({
            score: Math.round(baseScore),
            summary: `Interview completed with ${totalQuestions} questions answered. Scoring service temporarily unavailable.`
          }));
          
          onInterviewComplete?.(Math.round(baseScore), `Interview completed with ${totalQuestions} questions answered.`);
        } finally {
          setIsScoringAnswers(false);
        }
      } else {
        // Move to next question
        const nextQuestion = candidate.interviewProgress.generatedQuestions[currentIndex + 1];
        setCurrentQuestion(nextQuestion);
        setAnswerText('');
        setInputMethod('text'); // Reset to text input for next question
        startTimer(getTimeLimit(nextQuestion.difficulty));
        
        const isAutoSubmit = autoSubmitRef.current;
        autoSubmitRef.current = false;
        
        message.success(
          isAutoSubmit 
            ? `Time expired! Moving to question ${currentIndex + 2}...` 
            : `Answer submitted! Question ${currentIndex + 2} of ${totalQuestions} loaded.`
        );
      }

    } catch (error) {
      console.error('Failed to submit answer:', error);
      message.error('Failed to submit answer');
      // Restart timer if submission failed
      if (currentQuestion) {
        startTimer(getTimeLimit(currentQuestion.difficulty));
      }
    } finally {
      setIsSubmitting(false);  
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  // Check if interview should be restored
  useEffect(() => {
    if (candidate.interviewProgress?.startedAt && !interviewStarted && candidate.interviewProgress.generatedQuestions) {
      // Try to restore interview state
      const currentIndex = candidate.interviewProgress.questionIndex;
      const questions = candidate.interviewProgress.generatedQuestions;
      
      if (currentIndex < questions.length && !candidate.interviewProgress.isComplete) {
        const question = questions[currentIndex];
        setCurrentQuestion(question);
        setInterviewStarted(true);
        startTimer(getTimeLimit(question.difficulty));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.interviewProgress, interviewStarted]);

  // Check if interview is being scored
  if (isScoringAnswers) {
    return (
      <Card title="Evaluating Answers">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Title level={3}>🤖 AI is evaluating your answers...</Title>
          <Text>Please wait while we analyze your interview responses.</Text>
          <div style={{ marginTop: '20px' }}>
            <Progress type="circle" percent={75} format={() => '🧠'} />
          </div>
        </div>
      </Card>
    );
  }

  // Check if interview is complete
  if (candidate.interviewProgress?.isComplete) {
    return (
      <Card title="Interview Complete">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Title level={3}>🎉 Interview Completed!</Title>
          <Text>
            You have successfully answered all 6 questions. Thank you for completing the interview!
          </Text>
          {candidate.finalScore !== null && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px' }}>
              <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                Final Score: {candidate.finalScore}/100
              </Title>
            </div>
          )}
          {candidate.summary && (
            <div style={{ marginTop: '16px', textAlign: 'left', padding: '16px', backgroundColor: '#f0f2f5', borderRadius: '8px' }}>
              <Text strong>Interview Summary:</Text>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '8px 0 0 0' }}>
                {candidate.summary}
              </pre>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (!interviewStarted) {
    return (
      <Card title="Ready to Start Interview?" style={{ textAlign: 'center', padding: '40px' }}>
        <Space direction="vertical" size="large">
          <div>
            <Title level={4}>Technical Interview</Title>
            <p>You will be asked exactly 6 questions (2 Easy, 2 Medium, 2 Hard).</p>
            <p>Each question has a time limit. Answer will be auto-submitted when time expires.</p>
          </div>
          <Button 
            type="primary" 
            size="large" 
            onClick={handleStartInterview}
            disabled={!candidate.profile || !candidate.resumeText}
            loading={isGeneratingQuestions}
          >
            {isGeneratingQuestions ? 'Generating Questions...' : 'Start Interview'}
          </Button>
          {(!candidate.profile || !candidate.resumeText) && (
            <Text type="secondary">Please upload your resume first</Text>
          )}
        </Space>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>Loading question...</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Technical Interview</span>
          <Space>
            <Tag color={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty.toUpperCase()}
            </Tag>
            <Text strong>
              Question {(candidate.interviewProgress?.questionIndex || 0) + 1}/{candidate.interviewProgress?.generatedQuestions?.length || 6}
            </Text>
          </Space>
        </div>
      }
    >
      {/* Timer and Progress */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Space direction="vertical" size="small">
          <Progress
            type="circle"
            percent={getProgressPercent()}
            format={() => (
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ color: timeLeft <= 10 ? '#ff4d4f' : '#1890ff' }} />
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: timeLeft <= 10 ? '#ff4d4f' : '#1890ff'
                }}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
            strokeColor={timeLeft <= 10 ? '#ff4d4f' : '#1890ff'}
            size={80}
          />
          <Text type={timeLeft <= 10 ? 'danger' : 'secondary'}>
            {timeLeft <= 10 ? 'Time running out!' : 'Time remaining'}
          </Text>
        </Space>
      </div>

      {/* Question */}
      <Card 
        style={{ 
          marginBottom: '24px', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef'
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          {currentQuestion.question}
        </Title>
      </Card>

      {/* Answer Input */}
      <div style={{ marginBottom: '16px' }}>
        <Tabs
          activeKey={inputMethod}
          onChange={(key) => setInputMethod(key as 'text' | 'voice')}
          items={[
            {
              key: 'text',
              label: (
                <Space>
                  <EditOutlined />
                  Text Input
                </Space>
              ),
              children: (
                <TextArea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  disabled={isSubmitting}
                  style={{ fontSize: '14px' }}
                />
              ),
            },
            {
              key: 'voice',
              label: (
                <Space>
                  <AudioOutlined />
                  Voice Input
                </Space>
              ),
              children: (
                <VoiceRecorder
                  onTranscriptionComplete={(text) => {
                    setAnswerText(text);
                    setInputMethod('text'); // Switch to text view to show the transcribed text
                  }}
                  disabled={isSubmitting}
                  placeholder="Click the microphone and speak your answer..."
                  autoSubmitOnTimeout={true}
                  timeLeft={timeLeft}
                />
              ),
            },
          ]}
        />
      </div>

      {/* Submit Button */}
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button
            onClick={() => setInputMethod(inputMethod === 'text' ? 'voice' : 'text')}
            disabled={isSubmitting}
          >
            Switch to {inputMethod === 'text' ? 'Voice' : 'Text'}
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitAnswer}
            loading={isSubmitting}
            disabled={!answerText.trim() && timeLeft > 0}
            size="large"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </Space>
      </div>

      {/* Progress indicator */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Text type="secondary">
          Progress: {candidate.interviewProgress?.questionIndex || 0} of {candidate.interviewProgress?.generatedQuestions?.length || 6} questions completed
        </Text>
        <div style={{ marginTop: '8px' }}>
          <Progress 
            percent={(candidate.interviewProgress?.questionIndex || 0) / (candidate.interviewProgress?.generatedQuestions?.length || 6) * 100} 
            size="small"
            strokeColor="#1890ff"
            format={() => `${candidate.interviewProgress?.questionIndex || 0}/${candidate.interviewProgress?.generatedQuestions?.length || 6}`}
          />
        </div>
      </div>
    </Card>
  );
};

export default InterviewChat;