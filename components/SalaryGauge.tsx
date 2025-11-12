'use client';

interface SalaryGaugeProps {
  min: number;
  max: number;
  market?: { min: number; max: number };
  onChange?: (min: number, max: number) => void;
}

export default function SalaryGauge({ min, max, market, onChange }: SalaryGaugeProps) {
  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const midpoint = (min + max) / 2;
  const marketMidpoint = market ? (market.min + market.max) / 2 : midpoint;
  const comparison = midpoint - marketMidpoint;
  const percentDiff = market ? ((comparison / marketMidpoint) * 100).toFixed(1) : '0';

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          Salary Range
        </label>
        {market && (
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            Math.abs(parseFloat(percentDiff)) < 10
              ? 'bg-green-100 text-green-800'
              : parseFloat(percentDiff) > 0
              ? 'bg-blue-100 text-blue-800'
              : 'bg-orange-100 text-orange-800'
          }`}>
            {parseFloat(percentDiff) > 0 ? '+' : ''}{percentDiff}% vs market
          </span>
        )}
      </div>

      <div className="bg-gradient-to-r from-green-50 via-yellow-50 to-red-50 rounded-lg p-6 border border-gray-200">
        <div className="relative h-32 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-gray-200 relative">
              <div
                className="absolute inset-0 rounded-full border-8 border-blue-600"
                style={{
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                  transform: `rotate(${((midpoint - 50000) / 150000) * 180}deg)`,
                  transition: 'transform 0.5s ease-out',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatSalary(midpoint)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Average</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Minimum</span>
            <span className="text-sm font-semibold text-gray-900">{formatSalary(min)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Maximum</span>
            <span className="text-sm font-semibold text-gray-900">{formatSalary(max)}</span>
          </div>
        </div>
      </div>

      {market && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900">Market Rate (Mock Data)</p>
              <p className="text-xs text-gray-600 mt-1">
                {formatSalary(market.min)} - {formatSalary(market.max)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {parseFloat(percentDiff) > 10 && 'Your range is above market average. You may attract top talent.'}
                {parseFloat(percentDiff) < -10 && 'Your range is below market average. Consider adjusting to be competitive.'}
                {Math.abs(parseFloat(percentDiff)) <= 10 && 'Your range is competitive with current market rates.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
