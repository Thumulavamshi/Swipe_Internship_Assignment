import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF and DOCX files
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Resume upload endpoint
app.post('/api/resumes/upload', upload.single('resume'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    // Mock extracted data - in real implementation, this would use OCR/parsing
    const extractedData = {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "" // Intentionally missing to test UI
    };

    // Mock resume text - in real implementation, this would be extracted from the file
    const resumeText = `
      JANE DOE
      jane.doe@example.com
      
      EXPERIENCE
      Software Developer at Tech Company (2020-2023)
      - Developed web applications using React and Node.js
      - Collaborated with cross-functional teams
      - Implemented responsive UI components
      
      EDUCATION
      Bachelor of Science in Computer Science
      University of Technology (2016-2020)
      
      SKILLS
      JavaScript, TypeScript, React, Node.js, Express, MongoDB
    `.trim();

    const response = {
      candidateId: `cand_${Date.now()}`,
      extracted: extractedData,
      resumeText: resumeText,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    console.log(`Resume uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    res.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process resume upload'
    });
  }
});

// Hard-coded interview questions
const QUESTIONS = [
  { idx: 0, difficulty: 'easy', text: 'What is JSX?', timeLimit: 20 },
  { idx: 1, difficulty: 'easy', text: 'Explain component props vs state.', timeLimit: 20 },
  { idx: 2, difficulty: 'medium', text: 'Explain the virtual DOM.', timeLimit: 60 },
  { idx: 3, difficulty: 'medium', text: 'How do you handle authentication?', timeLimit: 60 },
  { idx: 4, difficulty: 'hard', text: 'Design a scalable microservice.', timeLimit: 120 },
  { idx: 5, difficulty: 'hard', text: 'Explain how you would optimize database queries for heavy reads.', timeLimit: 120 }
];

// In-memory store for interview sessions (in production, use database)
const interviewSessions: { [candidateId: string]: {
  startedAt: string;
  currentQuestionIndex: number;
  answers: Array<{
    questionIndex: number;
    question: string;
    answer: string;
    timeTaken: number;
    submittedAt: string;
  }>;
  isComplete: boolean;
}} = {};

// Start interview endpoint
app.post('/api/candidates/:id/start', (req, res) => {
  try {
    const candidateId = req.params.id;
    
    if (!candidateId) {
      return res.status(400).json({
        error: 'Candidate ID is required'
      });
    }

    // Initialize interview session
    interviewSessions[candidateId] = {
      startedAt: new Date().toISOString(),
      currentQuestionIndex: 0,
      answers: [],
      isComplete: false
    };

    // Return first question
    const firstQuestion = QUESTIONS[0];
    
    res.json({
      success: true,
      candidateId,
      sessionStarted: true,
      totalQuestions: QUESTIONS.length,
      currentQuestion: {
        ...firstQuestion,
        questionNumber: 1,
        totalQuestions: QUESTIONS.length
      }
    });

    console.log(`Interview started for candidate: ${candidateId}`);
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({
      error: 'Failed to start interview'
    });
  }
});

// Get specific question endpoint
app.get('/api/candidates/:id/question/:index', (req, res) => {
  try {
    const candidateId = req.params.id;
    const questionIndex = parseInt(req.params.index);

    if (!candidateId) {
      return res.status(400).json({
        error: 'Candidate ID is required'
      });
    }

    if (isNaN(questionIndex) || questionIndex < 0 || questionIndex >= QUESTIONS.length) {
      return res.status(400).json({
        error: `Invalid question index. Must be between 0 and ${QUESTIONS.length - 1}`
      });
    }

    // Check if session exists
    const session = interviewSessions[candidateId];
    if (!session) {
      return res.status(404).json({
        error: 'Interview session not found. Please start the interview first.'
      });
    }

    const question = QUESTIONS[questionIndex];
    
    res.json({
      success: true,
      question: {
        ...question,
        questionNumber: questionIndex + 1,
        totalQuestions: QUESTIONS.length
      },
      sessionInfo: {
        currentQuestionIndex: session.currentQuestionIndex,
        answersSubmitted: session.answers.length,
        isComplete: session.isComplete
      }
    });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      error: 'Failed to get question'
    });
  }
});

// Submit answer endpoint
app.post('/api/candidates/:id/answer', upload.single('audio'), (req, res) => {
  try {
    const candidateId = req.params.id;
    const { questionIndex, answerText, timeTaken } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        error: 'Candidate ID is required'
      });
    }

    const questionIdx = parseInt(questionIndex);
    if (isNaN(questionIdx) || questionIdx < 0 || questionIdx >= QUESTIONS.length) {
      return res.status(400).json({
        error: 'Invalid question index'
      });
    }

    // Check if session exists
    const session = interviewSessions[candidateId];
    if (!session) {
      return res.status(404).json({
        error: 'Interview session not found'
      });
    }

    // Store the answer
    const question = QUESTIONS[questionIdx];
    const answer = {
      questionIndex: questionIdx,
      question: question.text,
      answer: answerText || '',
      timeTaken: parseInt(timeTaken) || question.timeLimit,
      submittedAt: new Date().toISOString(),
      audioFile: req.file ? req.file.filename : null
    };

    session.answers.push(answer);
    session.currentQuestionIndex = questionIdx + 1;

    // Check if interview is complete
    const isLastQuestion = questionIdx === QUESTIONS.length - 1;
    if (isLastQuestion) {
      session.isComplete = true;
    }

    // Prepare response
    const response: any = {
      success: true,
      answerSubmitted: true,
      questionIndex: questionIdx,
      isComplete: session.isComplete,
      totalAnswers: session.answers.length,
      totalQuestions: QUESTIONS.length
    };

    // If not complete, include next question
    if (!session.isComplete) {
      const nextQuestion = QUESTIONS[session.currentQuestionIndex];
      response.nextQuestion = {
        ...nextQuestion,
        questionNumber: session.currentQuestionIndex + 1,
        totalQuestions: QUESTIONS.length
      };
    } else {
      // Calculate mock score for completed interview
      response.finalScore = 75 + Math.floor(Math.random() * 25); // Mock score 75-100
      response.summary = `Interview completed with ${session.answers.length} questions answered.`;
    }

    res.json(response);

    console.log(`Answer submitted for candidate ${candidateId}, question ${questionIdx + 1}`);
    if (session.isComplete) {
      console.log(`Interview completed for candidate: ${candidateId}`);
    }

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      error: 'Failed to submit answer'
    });
  }
});

// Get interview session status
app.get('/api/candidates/:id/status', (req, res) => {
  try {
    const candidateId = req.params.id;
    const session = interviewSessions[candidateId];

    if (!session) {
      return res.status(404).json({
        error: 'Interview session not found'
      });
    }

    res.json({
      success: true,
      candidateId,
      session: {
        startedAt: session.startedAt,
        currentQuestionIndex: session.currentQuestionIndex,
        answersSubmitted: session.answers.length,
        totalQuestions: QUESTIONS.length,
        isComplete: session.isComplete,
        answers: session.answers
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: 'Failed to get interview status'
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message === 'Only PDF and DOCX files are allowed') {
    return res.status(400).json({
      error: error.message
    });
  }

  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});

export default app;