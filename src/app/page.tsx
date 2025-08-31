import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Creator Sponsorship Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Connect creators with brands. Earn rewards through tasks, reviews, and content creation.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-purple-600">For Creators</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Find sponsorship opportunities, complete tasks, and earn crypto/cash rewards
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-green-600">For Brands</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with authentic creators and get quality content for your campaigns
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">Secure Payments</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Crypto and traditional payment options with smart contract protection
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Join as Creator
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Post Campaign
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
