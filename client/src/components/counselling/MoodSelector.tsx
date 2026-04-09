import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Mood } from '../../types';

interface MoodSelectorProps {
  onSelect: (mood: Mood, topic: string) => void;
  isLoading?: boolean;
  onClose?: () => void;
}

export function MoodSelector({ onSelect, isLoading, onClose }: MoodSelectorProps) {
  const moods: Array<{ value: Mood; emoji: string; label: string }> = [
    { value: 'ANXIOUS', emoji: '😰', label: 'Anxious' },
    { value: 'SAD', emoji: '😢', label: 'Sad' },
    { value: 'STRESSED', emoji: '😤', label: 'Stressed' },
    { value: 'OKAY', emoji: '😐', label: 'Okay' },
    { value: 'GOOD', emoji: '😊', label: 'Good' },
  ];

  const [selectedMood, setSelectedMood] = React.useState<Mood | null>(null);
  const [topic, setTopic] = React.useState('');

  React.useEffect(() => {
    if (!onClose) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(event) => {
        if (!onClose) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
      >
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        ) : null}
        <h2 className="text-3xl font-bold text-center mb-1 text-gray-900">How are you feeling?</h2>
        <p className="text-center text-gray-600 mb-8 text-sm">Select your current mood</p>

        <div className="grid grid-cols-5 gap-3 mb-8">
          {moods.map((mood) => (
            <motion.button
              key={mood.value}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 ${
                selectedMood === mood.value
                  ? 'bg-teal-500 ring-2 ring-teal-600 shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-4xl mb-2">{mood.emoji}</span>
              <span className={`text-xs text-center font-semibold ${
                selectedMood === mood.value ? 'text-white' : 'text-gray-800'
              }`}>
                {mood.label}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            What would you like to talk about? <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Homesickness, Academic pressure, Family issues..."
            className="w-full bg-white px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200 transition-all text-gray-900 placeholder-gray-500 caret-teal-600"
            spellCheck="false"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => selectedMood && onSelect(selectedMood, topic)}
          disabled={!selectedMood || isLoading}
          className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-400 text-white font-bold py-3 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting Session...
            </span>
          ) : (
            'Start Session'
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
