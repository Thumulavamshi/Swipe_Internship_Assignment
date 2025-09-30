import apiClient from './client';

export interface ParsedResumeData {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    website: string;
  };
  other_info: {
    education: Array<{
      institution: string;
    }>;
    experience: Array<{
      key: string;
      start: string;
      end: string;
      description: string[];
    }>;
    projects: Array<{
      title: string;
      description: string[];
    }>;
    extra_info: {
      skills: string[];
    };
  };
}

export interface ResumeUploadResponse {
  candidateId: string;
  extracted: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    website?: string;
    education?: Array<{
      institution: string;
    }>;
    experience?: Array<{
      key: string;
      start: string;
      end: string;
      description: string[];
    }>;
    projects?: Array<{
      title: string;
      description: string[];
    }>;
    skills?: string[];
  };
  resumeText: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface GeneratedQuestion {
  id: number;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  expected_topics: string[];
}

export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[];
  technology: string;
  candidate_name: string;
}

export interface ScoringPayload {
  candidate_info: {
    name: string;
    technology: string;
  };
  interview_data: Array<{
    question_id: number;
    question: string;
    difficulty: string;
    category: string;
    expected_topics: string[];
    answer: string;
    time_taken: number;
    max_time_allowed: number;
  }>;
}

export interface QuestionScore {
  question_id: number;
  question: string;
  difficulty: string;
  category: string;
  candidate_answer: string;
  time_taken: number;
  max_time_allowed: number;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ScoringResponse {
  candidate_info: {
    name: string;
    technology: string;
  };
  overall_score: number;
  detailed_scores: QuestionScore[];
  summary: string;
}

// Generate questions for interview
export const generateQuestions = async (parsedResumeData: ParsedResumeData): Promise<GenerateQuestionsResponse> => {
  try {
    const response = await apiClient.post('/generate-questions', parsedResumeData);
    return response.data;
  } catch (error) {
    console.error('Generate questions API error:', error);
    throw error;
  }
};

// Score interview answers
export const scoreAnswers = async (payload: ScoringPayload): Promise<ScoringResponse> => {
  try {
    const response = await apiClient.post('/score-answers', payload);
    return response.data;
  } catch (error) {
    console.error('Score answers API error:', error);
    throw error;
  }
};

// Upload and parse resume
export const uploadResume = async (file: File): Promise<ResumeUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Call the resume parsing API
    const parseResponse = await fetch('https://resume-parser-api-oxht.onrender.com/parse-resume', {
      method: 'POST',
      body: formData,
    });

    if (!parseResponse.ok) {
      throw new Error(`Resume parsing failed: ${parseResponse.status} ${parseResponse.statusText}`);
    }

    const parsedData: ParsedResumeData = await parseResponse.json();


    // Transform the parsed data to match our interface
    const extractedData = {
      name: parsedData.personal_info.name !== "not found" ? parsedData.personal_info.name : "",
      email: parsedData.personal_info.email !== "not found" ? parsedData.personal_info.email : "",
      phone: parsedData.personal_info.phone !== "not found" ? parsedData.personal_info.phone : "",
      linkedin: parsedData.personal_info.linkedin !== "not found" ? parsedData.personal_info.linkedin : undefined,
      github: parsedData.personal_info.github !== "not found" ? parsedData.personal_info.github : undefined,
      website: parsedData.personal_info.website !== "not found" ? parsedData.personal_info.website : undefined,
      education: parsedData.other_info.education || [],
      experience: parsedData.other_info.experience || [],
      projects: parsedData.other_info.projects || [],
      skills: parsedData.other_info.extra_info?.skills || []
    };

    // Generate a candidate ID
    const candidateId = `CAND-${Date.now()}`;

    // Create response object
    const response: ResumeUploadResponse = {
      candidateId,
      extracted: extractedData,
      resumeText: JSON.stringify(parsedData), // Store the full parsed data as text
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    };

    return response;

  } catch (error) {
    console.error('Upload resume error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload and parse resume');
  }
};