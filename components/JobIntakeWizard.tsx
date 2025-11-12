'use client';

import { useState } from 'react';
import LeniencySlider from './LeniencySlider';
import SalaryGauge from './SalaryGauge';

interface JobIntakeData {
  title: string;
  description: string;
  requiredSkills: string[];
  salaryMin: number;
  salaryMax: number;
  location: string;
  leniencyScore: number;
  priorities: string[];
  dealbreakers: string[];
  cultureFit: string;
}

interface JobIntakeWizardProps {
  onComplete: (data: JobIntakeData) => void;
}

export default function JobIntakeWizard({ onComplete }: JobIntakeWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<JobIntakeData>({
    title: '',
    description: '',
    requiredSkills: [],
    salaryMin: 80000,
    salaryMax: 120000,
    location: '',
    leniencyScore: 5,
    priorities: [],
    dealbreakers: [],
    cultureFit: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [priorityInput, setPriorityInput] = useState('');
  const [dealbreakerInput, setDealbreakerInput] = useState('');

  const addSkill = () => {
    if (skillInput.trim() && !data.requiredSkills.includes(skillInput.trim())) {
      setData({ ...data, requiredSkills: [...data.requiredSkills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setData({ ...data, requiredSkills: data.requiredSkills.filter(s => s !== skill) });
  };

  const addPriority = () => {
    if (priorityInput.trim() && !data.priorities.includes(priorityInput.trim())) {
      setData({ ...data, priorities: [...data.priorities, priorityInput.trim()] });
      setPriorityInput('');
    }
  };

  const removePriority = (priority: string) => {
    setData({ ...data, priorities: data.priorities.filter(p => p !== priority) });
  };

  const addDealbreaker = () => {
    if (dealbreakerInput.trim() && !data.dealbreakers.includes(dealbreakerInput.trim())) {
      setData({ ...data, dealbreakers: [...data.dealbreakers, dealbreakerInput.trim()] });
      setDealbreakerInput('');
    }
  };

  const removeDealbreaker = (dealbreaker: string) => {
    setData({ ...data, dealbreakers: data.dealbreakers.filter(d => d !== dealbreaker) });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.title.trim() && data.description.trim() && data.location.trim();
      case 2:
        return data.requiredSkills.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    onComplete(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s < step ? 'bg-blue-600 text-white' :
                s === step ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  s < step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-600">Basic Info</span>
          <span className="text-xs text-gray-600">Skills</span>
          <span className="text-xs text-gray-600">Compensation</span>
          <span className="text-xs text-gray-600">Preferences</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Basic Job Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the role, responsibilities, and ideal candidate..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Remote, San Francisco, CA"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Required Skills</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Skills
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., React, Python, AWS"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
            {data.requiredSkills.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Skills ({data.requiredSkills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {data.requiredSkills.map((skill) => (
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
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Compensation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  value={data.salaryMin}
                  onChange={(e) => setData({ ...data, salaryMin: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  value={data.salaryMax}
                  onChange={(e) => setData({ ...data, salaryMax: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="5000"
                />
              </div>
            </div>
            <SalaryGauge
              min={data.salaryMin}
              max={data.salaryMax}
              market={{ min: 90000, max: 130000 }}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Hiring Preferences</h2>

            <LeniencySlider
              value={data.leniencyScore}
              onChange={(value) => setData({ ...data, leniencyScore: value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorities (Optional)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPriority())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Team leadership experience"
                />
                <button
                  onClick={addPriority}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {data.priorities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.priorities.map((priority) => (
                    <span
                      key={priority}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {priority}
                      <button
                        onClick={() => removePriority(priority)}
                        className="ml-2 hover:text-green-900"
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
                Dealbreakers (Optional)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={dealbreakerInput}
                  onChange={(e) => setDealbreakerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDealbreaker())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Must have 5+ years experience"
                />
                <button
                  onClick={addDealbreaker}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {data.dealbreakers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.dealbreakers.map((dealbreaker) => (
                    <span
                      key={dealbreaker}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                    >
                      {dealbreaker}
                      <button
                        onClick={() => removeDealbreaker(dealbreaker)}
                        className="ml-2 hover:text-red-900"
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
                Culture Fit (Optional)
              </label>
              <textarea
                value={data.cultureFit}
                onChange={(e) => setData({ ...data, cultureFit: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your company culture and ideal team member..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
