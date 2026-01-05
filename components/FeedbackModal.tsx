import React, { useState } from 'react';
import { X, Send, MessageSquare, Star, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { dbService } from '../services/dbService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      await dbService.submitFeedback(feedback, category, rating);
      toast.success("Operational Insight Transmitted", { icon: '🚀' });
      setFeedback('');
      setRating(0);
      onClose();
    } catch (error) {
      toast.error("Handshake Link Failure: Queued locally.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
            <MessageSquare size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter uppercase">Operational Feedback</h2>
          <p className="text-indigo-100 text-xs font-bold tracking-widest mt-2 uppercase opacity-80">Mission Intelligence Reporting</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Feedback Category</label>
            <div className="grid grid-cols-2 gap-3">
              {['UX/Interface', 'Operational Error', 'Feature Request', 'Intelligence Suggestion'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    category === cat 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Priority Level (Rating)</label>
            <div className="flex gap-4 justify-center py-2 bg-slate-950 rounded-2xl border border-slate-800">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`transition-all hover:scale-110 ${rating >= s ? 'text-kvi-gold' : 'text-slate-800'}`}
                >
                  <Star size={28} fill={rating >= s ? "currentColor" : "none"} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Briefing / Details</label>
            <textarea
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe the anomaly or proposed enhancement..."
              className="w-full bg-slate-950 border border-slate-800 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm h-32 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !feedback.trim()}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Sparkles className="animate-spin" size={20} />
            ) : (
              <><Send size={18} /> Authorize Transmission</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;