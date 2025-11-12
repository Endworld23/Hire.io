'use client';

import { useState } from 'react';

interface ResumeUploadProps {
  onUpload: (file: File, parsedText: string) => void;
}

export default function ResumeUpload({ onUpload }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(selectedFile.type)) {
        setError('Only PDF, DOC, DOCX, and TXT files are supported');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const parseResume = async (file: File): Promise<string> => {
    setParsing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockParsedText = `
PROFESSIONAL SUMMARY
Experienced software engineer with ${Math.floor(Math.random() * 10) + 3} years in full-stack development.

SKILLS
- JavaScript, TypeScript, React, Node.js
- Python, Java, C++
- SQL, MongoDB, PostgreSQL
- AWS, Docker, Kubernetes

EXPERIENCE
Senior Software Engineer at Tech Corp (2020-Present)
- Led development of microservices architecture
- Improved system performance by 40%

Software Engineer at Startup Inc (2018-2020)
- Built customer-facing web applications
- Collaborated with cross-functional teams

EDUCATION
BS Computer Science, University (2018)
    `.trim();

    setParsing(false);
    return mockParsedText;
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const parsedText = await parseResume(file);
      onUpload(file, parsedText);
    } catch (err) {
      setError('Failed to parse resume. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="resume-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT up to 5MB</p>
          </div>
        </label>
      </div>

      {file && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || parsing}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {parsing ? 'Parsing Resume...' : 'Upload & Parse Resume'}
      </button>

      {parsing && (
        <div className="text-center text-sm text-gray-600">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Extracting skills and experience...
        </div>
      )}
    </div>
  );
}
