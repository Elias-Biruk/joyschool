import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-2xl font-bold text-blue-600">JoyEdu</div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Learn New Skills with Interactive Courses
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master programming, web development, and more with hands-on exercises,
            real-time feedback, and expert instruction.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Start Learning Free
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="text-lg">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">Interactive Learning</h3>
            <p className="text-gray-600">
              Practice with real coding exercises and get instant feedback on your solutions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">Expert Instructors</h3>
            <p className="text-gray-600">
              Learn from industry professionals with years of real-world experience.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">Learn at Your Pace</h3>
            <p className="text-gray-600">
              Access courses anytime, anywhere, and track your progress as you learn.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
