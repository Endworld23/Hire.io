'use client';

interface Candidate {
  id: string;
  anonymousId: string;
  matchScore: number;
  skills: string[];
  experienceYears: number;
  strengths: string[];
  concerns: string[];
  isShortlisted: boolean;
}

interface AnonymizedShortlistProps {
  candidates: Candidate[];
  onToggleShortlist: (candidateId: string) => void;
  onViewProfile: (candidateId: string) => void;
}

export default function AnonymizedShortlist({
  candidates,
  onToggleShortlist,
  onViewProfile
}: AnonymizedShortlistProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const sortedCandidates = [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Candidate Matches ({candidates.length})
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {candidates.filter(c => c.isShortlisted).length} shortlisted
          </span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Anonymous Matching</p>
            <p className="text-xs text-blue-700 mt-1">
              All candidate information is anonymized to reduce bias. Personal details are revealed only after shortlisting.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sortedCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className={`bg-white rounded-lg shadow border-2 transition-all ${
              candidate.isShortlisted ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Candidate {candidate.anonymousId}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(candidate.matchScore)}`}>
                      {candidate.matchScore}% Match
                    </span>
                    {candidate.isShortlisted && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        Shortlisted
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {candidate.experienceYears} years of experience
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{candidate.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Key Strengths
                  </p>
                  <ul className="space-y-1">
                    {candidate.strengths.slice(0, 3).map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-1">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {candidate.concerns.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Considerations
                  </p>
                  <ul className="space-y-1">
                    {candidate.concerns.slice(0, 2).map((concern, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-yellow-500 mr-1">⚠</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => onToggleShortlist(candidate.id)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    candidate.isShortlisted
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {candidate.isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                </button>
                <button
                  onClick={() => onViewProfile(candidate.id)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {sortedCandidates.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Candidates will appear here once the AI processes applications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
