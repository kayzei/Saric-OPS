import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Optimization: Reduced login simulation time
    setTimeout(() => {
        setLoading(false);
        onLogin();
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-saric-500 rounded-full filter blur-[100px] transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md relative z-10">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white tracking-wider">SARIC <span className="text-saric-500">OPS</span></h1>
                <p className="text-slate-400 text-sm mt-2">Secure Logistics Management Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Employee ID</label>
                    <input 
                        type="text" 
                        defaultValue="SARIC-ADMIN"
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-saric-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Password</label>
                    <input 
                        type="password" 
                        defaultValue="password"
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-saric-500 outline-none transition-all"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-saric-600 to-saric-500 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:from-saric-500 hover:to-saric-400 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        "ACCESS TERMINAL"
                    )}
                </button>
            </form>
            <div className="mt-6 text-center">
                <p className="text-[10px] text-gray-500">Unauthorized access is prohibited. System monitored by KVI.</p>
            </div>
        </div>
    </div>
  );
};

export default Login;