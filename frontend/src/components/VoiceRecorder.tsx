import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Space, Typography, Card, Progress, Spin } from 'antd';
import { 
  AudioOutlined, 
  LoadingOutlined, 
  CheckCircleOutlined,
  StopOutlined 
} from '@ant-design/icons';

// Type declarations for Web Speech API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): ISpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): ISpeechRecognition;
    };
  }
}

const { Text } = Typography;

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoSubmitOnTimeout?: boolean;
  timeLeft?: number;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  disabled = false,
  placeholder = "Click the microphone to start speaking...",
  autoSubmitOnTimeout = false,
  timeLeft = 0
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [finalTranscript, setFinalTranscript] = useState('');

  const speechRecognition = useRef<ISpeechRecognition | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationFrame = useRef<number | undefined>(undefined);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      
      if (speechRecognition.current) {
        speechRecognition.current.continuous = true;
        speechRecognition.current.interimResults = true;
        speechRecognition.current.lang = 'en-US';

        speechRecognition.current.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        speechRecognition.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript);
        if (finalText) {
          setFinalTranscript(prev => prev + finalText);
        }
        };

        speechRecognition.current.onend = () => {
          setIsListening(false);
          if (audioContext.current) {
            audioContext.current.close();
          }
          if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => track.stop());
          }
          if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
          }
        };

        speechRecognition.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };
      }
    } else {
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, []);

  // Audio level visualization
  const updateAudioLevel = () => {
    if (analyser.current) {
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
      analyser.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 100 * 3)); // Amplify for better visual
      
      animationFrame.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const stopRecording = useCallback(() => {
    if (speechRecognition.current && isListening) {
      speechRecognition.current.stop();
    }
  }, [isListening]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setIsProcessing(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const fullTranscript = finalTranscript + transcript;
      if (fullTranscript.trim()) {
        onTranscriptionComplete(fullTranscript.trim());
      }
      setIsProcessing(false);
    }, 500);
  }, [finalTranscript, transcript, onTranscriptionComplete, stopRecording]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (autoSubmitOnTimeout && timeLeft <= 1 && (finalTranscript || transcript)) {
      handleStopRecording();
    }
  }, [timeLeft, autoSubmitOnTimeout, finalTranscript, transcript, handleStopRecording]);

  const startRecording = async () => {
    if (!speechRecognition.current) {
      setError('Speech recognition not available');
      return;
    }

    try {
      // Get microphone access for audio level monitoring
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new AudioContext();
      const source = audioContext.current.createMediaStreamSource(mediaStream.current);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);
      
      // Start audio level monitoring
      updateAudioLevel();

      // Clear previous transcripts
      setTranscript('');
      setFinalTranscript('');
      setError(null);
      
      // Start speech recognition
      speechRecognition.current.start();
    } catch (err) {
      setError('Microphone access denied');
      console.error('Error accessing microphone:', err);
    }
  };

  const handleClearTranscript = () => {
    setTranscript('');
    setFinalTranscript('');
  };

  const getButtonIcon = () => {
    if (isProcessing) return <LoadingOutlined spin />;
    if (isListening) return <StopOutlined />;
    return <AudioOutlined />;
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Stop Recording';
    return 'Start Recording';
  };

  const fullTranscript = finalTranscript + transcript;

  return (
    <Card 
      size="small" 
      style={{ 
        border: isListening ? '2px solid #1890ff' : '1px solid #d9d9d9',
        backgroundColor: isListening ? '#f6ffed' : '#fafafa'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Recording Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <Button
            type={isListening ? "primary" : "default"}
            icon={getButtonIcon()}
            onClick={isListening ? handleStopRecording : startRecording}
            disabled={disabled || isProcessing}
            size="large"
            style={{ 
              borderRadius: '50%', 
              width: '60px', 
              height: '60px',
              boxShadow: isListening ? '0 0 20px rgba(24, 144, 255, 0.3)' : 'none'
            }}
          />
          
          {/* Audio Level Indicator */}
          {isListening && (
            <div style={{ width: '100px' }}>
              <Progress 
                percent={audioLevel} 
                showInfo={false} 
                strokeColor={{
                  '0%': '#87d068',
                  '50%': '#ffe58f',
                  '100%': '#ffccc7',
                }}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Audio Level
              </Text>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">{getButtonText()}</Text>
        </div>

        {/* Live Transcript Display */}
        {(isListening || fullTranscript) && (
          <div 
            style={{ 
              minHeight: '80px', 
              padding: '12px', 
              backgroundColor: 'white', 
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          >
            {isListening && (
              <div style={{ marginBottom: '8px' }}>
                <Spin size="small" />
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  Listening...
                </Text>
              </div>
            )}
            
            {finalTranscript && (
              <Text>{finalTranscript}</Text>
            )}
            
            {transcript && (
              <Text type="secondary" style={{ opacity: 0.7 }}>
                {transcript}
              </Text>
            )}
            
            {!fullTranscript && !isListening && (
              <Text type="secondary" style={{ fontStyle: 'italic' }}>
                {placeholder}
              </Text>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {fullTranscript && !isListening && (
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button 
              size="small" 
              onClick={handleClearTranscript}
              disabled={isProcessing}
            >
              Clear
            </Button>
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => onTranscriptionComplete(fullTranscript.trim())}
              disabled={isProcessing}
            >
              Use This Answer
            </Button>
          </Space>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <Spin />
            <Text type="secondary" style={{ marginLeft: '8px' }}>
              Converting speech to text...
            </Text>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <Text type="danger" style={{ fontSize: '12px' }}>
              {error}
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default VoiceRecorder;