'use client';

import { useState } from 'react';

interface LeniencySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function LeniencySlider({ value, onChange }: LeniencySliderProps) {
  const labels = [
    { value: 1, label: 'Very Strict', description: 'Only exact matches' },
    { value: 3, label: 'Strict', description: 'Close matches preferred' },
    { value: 5, label: 'Balanced', description: 'Mix of exact and potential' },
    { value: 7, label: 'Lenient', description: 'Open to potential' },
    { value: 10, label: 'Very Lenient', description: 'Maximum flexibility' },
  ];

  const currentLabel = labels.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          Hiring Leniency
        </label>
        <span className="text-sm font-semibold text-blue-600">
          {currentLabel.label}
        </span>
      </div>

      <div className="relative pt-1">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - 1) / 9) * 100}%, #e5e7eb ${((value - 1) / 9) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Strict</span>
          <span className="text-center">{value}</span>
          <span>Lenient</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">{currentLabel.description}</span>
          <br />
          <span className="text-xs text-blue-600 mt-1 inline-block">
            {value <= 3 && 'AI will prioritize exact skill and experience matches.'}
            {value > 3 && value <= 7 && 'AI will consider transferable skills and growth potential.'}
            {value > 7 && 'AI will focus on learning ability and culture fit over current skills.'}
          </span>
        </p>
      </div>
    </div>
  );
}
