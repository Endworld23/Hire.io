'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AnonymizedShortlist from '@/components/AnonymizedShortlist';
import AdminTableView from '@/components/AdminTableView';

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [view, setView] = useState<'flow' | 'admin'>('flow');
  const [flowStep, setFlowStep] = useState(1);
  const [adminData, setAdminData] = useState<any>({
    employers: [],
    candidates: [],
    jobs: [],
    matches: [],
    feedback: [],
  });

  const [mockCandidates, setMockCandidates] = useState([
    {
      id: '1',
      anonymousId: 'A47B',
      matchScore: 92,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
      experienceYears: 6,
      strengths: [
        'Strong full-stack experience with modern technologies',
        'Proven track record in building scalable applications',
        'Experience with cloud infrastructure'
      ],
      concerns: ['Salary expectation slightly above range'],
      isShortlisted: false,
    },
    {
      id: '2',
      anonymousId: 'C92F',
      matchScore: 85,
      skills: ['JavaScript', 'React', 'Python', 'MongoDB', 'Docker'],
      experienceYears: 4,
      strengths: [
        'Versatile across frontend and backend',
        'Strong problem-solving skills',
        'Experience with containerization'
      ],
      concerns: ['Limited experience with PostgreSQL', 'No AWS experience'],
      isShortlisted: false,
    },
    {
      id: '3',
      anonymousId: 'E18K',
      matchScore: 78,
      skills: ['TypeScript', 'Vue.js', 'Node.js', 'MySQL', 'Git'],
      experienceYears: 5,
      strengths: [
        'Solid backend development experience',
        'Good understanding of database design',
        'Team collaboration experience'
      ],
      concerns: ['Framework mismatch (Vue vs React)', 'No cloud experience'],
      isShortlisted: false,
    },
    {
      id: '4',
      anonymousId: 'G31M',
      matchScore: 71,
      skills: ['JavaScript', 'Angular', 'Java', 'Spring Boot', 'Jenkins'],
      experienceYears: 7,
      strengths: [
        'Extensive enterprise development experience',
        'Strong CI/CD knowledge',
        'Leadership experience'
      ],
      concerns: ['Different tech stack', 'May be overqualified'],
      isShortlisted: false,
    },
    {
      id: '5',
      anonymousId: 'J44P',
      matchScore: 65,
      skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
      experienceYears: 2,
      strengths: [
        'Strong React fundamentals',
        'Quick learner',
        'Good cultural fit'
      ],
      concerns: ['Junior level experience', 'Limited backend knowledge', 'No database experience'],
      isShortlisted: false,
    },
  ]);

  const seedMockData = async () => {
    setLoading(true);
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const employerData = {
        id: '10000000-0000-0000-0000-000000000001',
        user_id: userId,
        company_name: 'TechCorp Inc',
        industry: 'Software',
      };

      const candidatesData = [
        {
          id: '20000000-0000-0000-0000-000000000001',
          user_id: userId,
          full_name: 'Alice Johnson',
          email: 'alice@example.com',
          skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
          experience_years: 6,
          resume_text: 'Experienced full-stack developer...',
        },
        {
          id: '20000000-0000-0000-0000-000000000002',
          user_id: userId,
          full_name: 'Bob Smith',
          email: 'bob@example.com',
          skills: ['JavaScript', 'React', 'Python', 'MongoDB', 'Docker'],
          experience_years: 4,
          resume_text: 'Versatile software engineer...',
        },
        {
          id: '20000000-0000-0000-0000-000000000003',
          user_id: userId,
          full_name: 'Carol Williams',
          email: 'carol@example.com',
          skills: ['TypeScript', 'Vue.js', 'Node.js', 'MySQL', 'Git'],
          experience_years: 5,
          resume_text: 'Backend specialist with frontend skills...',
        },
      ];

      const jobData = {
        id: '30000000-0000-0000-0000-000000000001',
        employer_id: employerData.id,
        title: 'Senior Full-Stack Developer',
        description: 'We are looking for an experienced full-stack developer...',
        required_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        salary_min: 100000,
        salary_max: 140000,
        location: 'Remote',
        status: 'active',
      };

      const jobIntakeData = {
        job_id: jobData.id,
        leniency_score: 6,
        priorities: ['Team collaboration', 'Problem-solving skills'],
        dealbreakers: ['Less than 3 years experience'],
        culture_fit: 'We value innovation and work-life balance',
      };

      const matchesData = [
        {
          id: '40000000-0000-0000-0000-000000000001',
          job_id: jobData.id,
          candidate_id: candidatesData[0].id,
          match_score: 92,
          is_shortlisted: false,
          employer_viewed: false,
        },
        {
          id: '40000000-0000-0000-0000-000000000002',
          job_id: jobData.id,
          candidate_id: candidatesData[1].id,
          match_score: 85,
          is_shortlisted: false,
          employer_viewed: false,
        },
        {
          id: '40000000-0000-0000-0000-000000000003',
          job_id: jobData.id,
          candidate_id: candidatesData[2].id,
          match_score: 78,
          is_shortlisted: false,
          employer_viewed: false,
        },
      ];

      const feedbackData = {
        match_id: matchesData[0].id,
        employer_id: employerData.id,
        rating: 5,
        comments: 'Excellent candidate, moving forward with interview',
      };

      setAdminData({
        employers: [employerData],
        candidates: candidatesData,
        jobs: [jobData],
        matches: matchesData,
        feedback: [feedbackData],
      });

      setSeeded(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShortlist = (candidateId: string) => {
    setMockCandidates(prevCandidates =>
      prevCandidates.map(c =>
        c.id === candidateId ? { ...c, isShortlisted: !c.isShortlisted } : c
      )
    );
  };

  const handleViewProfile = (candidateId: string) => {
    const candidate = mockCandidates.find(c => c.id === candidateId);
    alert(`Viewing full profile for Candidate ${candidate?.anonymousId}\n\nIn Phase 1, this would reveal:\n- Full name\n- Complete resume\n- Contact information\n- Detailed work history`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Hire.io - Phase 0 Demo</h1>
          <p className="text-blue-100 mt-2">End-to-end hiring platform demonstration</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900">Demo Mode</h3>
              <p className="text-xs text-yellow-800 mt-1">
                This is a demonstration of the Hire.io platform with mock data. In Phase 1, all features will be fully functional with real database integration and AI-powered matching.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setView('flow')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'flow'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📊 End-to-End Flow
          </button>
          <button
            onClick={() => setView('admin')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🛠️ Admin Tables
          </button>
          {!seeded && (
            <button
              onClick={seedMockData}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Seeding...' : '🌱 Seed Mock Data'}
            </button>
          )}
        </div>

        {view === 'flow' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Hiring Flow Demonstration</h2>
                  <div className="text-sm text-gray-600">Step {flowStep} of 5</div>
                </div>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div
                        className={`h-2 rounded-full flex-1 ${
                          step <= flowStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {flowStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Step 1: Employer Creates Job
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Employer uses the Job Intake Wizard to define requirements, set salary range, and configure hiring preferences with leniency slider.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
                      <h4 className="font-semibold mb-3">Job Created:</h4>
                      <ul className="space-y-2 text-sm">
                        <li><strong>Title:</strong> Senior Full-Stack Developer</li>
                        <li><strong>Skills:</strong> React, TypeScript, Node.js, PostgreSQL</li>
                        <li><strong>Salary:</strong> $100k - $140k</li>
                        <li><strong>Leniency:</strong> 6/10 (Lenient)</li>
                        <li><strong>Location:</strong> Remote</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setFlowStep(2)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              )}

              {flowStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Step 2: Candidates Apply
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Candidates build profiles using the Profile Builder, upload resumes, and the system parses their skills and experience automatically.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
                      <h4 className="font-semibold mb-3">Candidates Applied: 5</h4>
                      <div className="space-y-3">
                        {['Alice Johnson (6 yrs)', 'Bob Smith (4 yrs)', 'Carol Williams (5 yrs)', 'David Brown (7 yrs)', 'Eve Davis (2 yrs)'].map((name, i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                              {i + 1}
                            </div>
                            <span className="text-sm">{name}</span>
                            <span className="ml-auto text-xs text-green-600">✓ Resume Parsed</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setFlowStep(1)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setFlowStep(3)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              )}

              {flowStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Step 3: AI Matching
                    </h3>
                    <p className="text-gray-600 mb-6">
                      AI analyzes candidates based on skills, experience, job requirements, and employer's leniency settings to generate match scores.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
                      <h4 className="font-semibold mb-3">Matching Complete:</h4>
                      <div className="space-y-2">
                        {[
                          { score: 92, id: 'A47B', quality: 'Excellent' },
                          { score: 85, id: 'C92F', quality: 'Very Good' },
                          { score: 78, id: 'E18K', quality: 'Good' },
                          { score: 71, id: 'G31M', quality: 'Fair' },
                          { score: 65, id: 'J44P', quality: 'Potential' },
                        ].map((match) => (
                          <div key={match.id} className="flex items-center justify-between text-sm">
                            <span>Candidate {match.id}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">{match.quality}</span>
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${match.score}%` }}
                                />
                              </div>
                              <span className="font-semibold w-8">{match.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setFlowStep(2)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setFlowStep(4)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              )}

              {flowStep === 4 && (
                <div className="space-y-4">
                  <div className="py-4">
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">🎯</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Step 4: Anonymized Shortlist Review
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Employer reviews anonymized candidates to reduce bias. Toggle candidates to shortlist for detailed review.
                      </p>
                    </div>
                    <AnonymizedShortlist
                      candidates={mockCandidates}
                      onToggleShortlist={handleToggleShortlist}
                      onViewProfile={handleViewProfile}
                    />
                  </div>
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setFlowStep(3)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setFlowStep(5)}
                      disabled={mockCandidates.filter(c => c.isShortlisted).length === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              )}

              {flowStep === 5 && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Step 5: Feedback & Iteration
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Employer provides feedback on shortlisted candidates, helping improve future matches.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
                      <h4 className="font-semibold mb-4">Shortlisted Candidates:</h4>
                      {mockCandidates.filter(c => c.isShortlisted).length === 0 ? (
                        <p className="text-sm text-gray-600">No candidates shortlisted yet. Go back to Step 4 to select candidates.</p>
                      ) : (
                        <div className="space-y-4">
                          {mockCandidates.filter(c => c.isShortlisted).map((candidate) => (
                            <div key={candidate.id} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Candidate {candidate.anonymousId}</span>
                                <span className="text-sm text-blue-600">{candidate.matchScore}% match</span>
                              </div>
                              <div className="text-sm text-gray-600 mb-3">
                                Skills: {candidate.skills.join(', ')}
                              </div>
                              <div className="flex space-x-2">
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                                  ✓ Move to Interview
                                </button>
                                <button className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">
                                  ✗ Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
                        <h4 className="font-semibold text-green-900 mb-2">🎉 Demo Complete!</h4>
                        <p className="text-sm text-green-800">
                          You've seen the complete hiring flow from job creation to candidate feedback. Check the Admin Tables view to see all the data created during this demo.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setFlowStep(4)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setFlowStep(1)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Restart Demo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div>
            {!seeded ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Seed Mock Data First</h3>
                <p className="text-gray-600 mb-6">
                  Click the "Seed Mock Data" button above to populate the database with sample records.
                </p>
              </div>
            ) : (
              <AdminTableView data={adminData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
