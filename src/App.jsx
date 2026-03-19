import { Rocket } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-full mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Project Setup Complete</h1>
          <p className="text-indigo-100 mt-2">Vite + React + Tailwind CSS + Lucide</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Tailwind CSS v4
            </h2>
            <p className="text-sm text-gray-600 mt-1">Utility-first styling is working perfectly.</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Lucide React
            </h2>
            <p className="text-sm text-gray-600 mt-1">Icons are loaded and rendering cleanly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
