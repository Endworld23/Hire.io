'use client';

import { useState } from 'react';
import ResumeUpload from './ResumeUpload';

interface CandidateProfile {
  fullName: string;
  email: string;
  skills: string[];
  experienceYears: number;
  resumeText: string;
  resumeFile?: File;
}

interface CandidateProfileBuilderProps {
  onComplete: (profile: CandidateProfile) => void;
}

export default function CandidateProfileBuilder({ onComplete }: CandidateProfileBuilderProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<CandidateProfile>({
    fullName: '',
    email: '',
    skills: [],
    experienceYears: 0,
    resumeText: '',
  });
  const [skillInput, setSkillInput] = useState('');

  const handleResumeUpload = (file: File, parsedText: string) => {
    const extractedSkills = parsedText
      .match(/(JavaScript|TypeScript|React|Node\.js|Python|Java|C\+\+|SQL|MongoDB|PostgreSQL|AWS|Docker|Kubernetes)/gi)
      ?.filter((v, i, a) => a.indexOf(v) === i) || [];

    const expMatch = parsedText.match(/(\d+)\s*years/i);
    const years = expMatch ? parseInt(expMatch[1]) : 0;

    setProfile({
      ...profile,
      skills: [...new Set([...profile.skills, ...extractedSkills])],
      experienceYears: years,
      resumeText: parsedText,
      resumeFile: file,
    });
    setStep(2);
  };

  const addSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const canSubmit = () => {
    return profile.fullName.trim() && profile.email.trim() && profile.skills.length > 0;
  };

  const handleSubmit = () => {
    onComplete(profile);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s < step ? 'bg-blue-600 text-white' :
                s === step ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  s < step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-600">Upload Resume</span>
          <span className="text-xs text-gray-600">Review & Edit</span>
          <span className="text-xs text-gray-600">Basic Info</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Upload Your Resume</h2>
              <p className="text-gray-600 mt-2">
                We'll automatically extract your skills and experience
              </p>
            </div>
            <div className="flex justify-center pt-4">
              <ResumeUpload onUpload={handleResumeUpload} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Review Extracted Information</h2>
              <p className="text-gray-600 mt-2">
                Make any corrections or additions below
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add more skills..."
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                value={profile.experienceYears}
                onChange={(e) => setProfile({ ...profile, experienceYears: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="50"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Resume Preview</p>
              <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {profile.resumeText.substring(0, 500)}
                {profile.resumeText.length > 500 && '...'}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Re-upload
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
              <p className="text-gray-600 mt-2">
                Add your contact information to finish
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Profile Summary</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• {profile.skills.length} skills identified</li>
                <li>• {profile.experienceYears} years of experience</li>
                <li>• Resume uploaded and processed</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
