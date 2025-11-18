import React from 'react';

const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="relative w-32 h-32 mb-8">
        {/* Rotating Outer Ring */}
        <div className="absolute inset-0 border-4 border-t-saric-500 border-r-transparent border-b-saric-600 border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        
        {/* Inner Geometric Shape */}
        <div className="absolute inset-4 border-2 border-white/20 bg-slate-800 rotate-45 flex items-center justify-center shadow-lg shadow-saric-500/20">
            <div className="w-4 h-4 bg-saric-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-[0.3em] text-white mb-2 animate-pulse">
        SARIC <span className="text-saric-500">LOGISTICS</span>
      </h1>
      
      <div className="flex items-center space-x-2 text-xs text-gray-400 mt-4 opacity-80">
        <span className="uppercase tracking-widest">Powered by</span>
        <span className="font-bold text-kvi-gold border border-kvi-gold px-2 py-0.5 rounded">KVI SYSTEMS</span>
      </div>

      <div className="absolute bottom-10 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-saric-500 to-kvi-gold w-1/2 animate-[slide_2s_infinite_linear]"></div>
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default Preloader;