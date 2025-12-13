import Link from 'next/link'
import { AuthHashRedirect } from './components/auth-hash-redirect'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <AuthHashRedirect />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Hire<span className="text-blue-600">.io</span>
          </h1>
          <p className="text-2xl text-gray-600 mb-2">Phase 0 - Foundation Build</p>
          <p className="text-lg text-gray-500">AI-Powered Hiring Platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Demo</h2>
            <p className="text-gray-600 mb-6">
              Experience the complete end-to-end hiring flow with mock data. See how employers create jobs,
              candidates apply, AI matches them, and anonymized shortlists work.
            </p>
            <Link
              href="/demo"
              className="inline-block w-full px-6 py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Launch Demo
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Documentation</h2>
            <p className="text-gray-600 mb-6">
              View the README for setup instructions, architecture details, and Phase 1 roadmap with TODOs and
              extension points.
            </p>
            <a
              href="https://github.com"
              className="inline-block w-full px-6 py-3 bg-gray-200 text-gray-800 text-center font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              View README
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl">🏢</div>
              <h3 className="font-semibold text-gray-900">Employer Tools</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Job intake wizard</li>
                <li>Leniency slider</li>
                <li>Salary gauge</li>
                <li>Anonymized candidates</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">👤</div>
              <h3 className="font-semibold text-gray-900">Candidate Tools</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Profile builder</li>
                <li>Resume upload</li>
                <li>Auto-parsing</li>
                <li>Skill extraction</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🤖</div>
              <h3 className="font-semibold text-gray-900">AI Matching</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Match scoring</li>
                <li>Bias reduction</li>
                <li>Smart shortlists</li>
                <li>Feedback loops</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔧 Technical Stack</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-1">Frontend:</p>
              <p>Next.js 16, React, TypeScript, Tailwind CSS</p>
            </div>
            <div>
              <p className="font-medium mb-1">Backend:</p>
              <p>Supabase (PostgreSQL + Auth + Storage)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
