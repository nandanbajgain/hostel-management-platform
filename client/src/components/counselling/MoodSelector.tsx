import React from 'react';
import { motion } from 'framer-motion';
import type { Mood } from '../../types';

interface MoodSelectorProps {
  onSelect: (mood: Mood, topic: string) => void;
  isLoading?: boolean;
}

export function MoodSelector({ onSelect, isLoading }: MoodSelectorProps) {
  const moods: Array<{ value: Mood; emoji: string; label: string }> = [
    { value: 'ANXIOUS', emoji: '😰', label: 'Anxious' },
    { value: 'SAD', emoji: '😢', label: 'Sad' },
    { value: 'STRESSED', emoji: '😤', label: 'Stressed' },
    { value: 'OKAY', emoji: '😐', label: 'Okay' },
    { value: 'GOOD', emoji: '😊', label: 'Good' },
  ];

  const [selectedMood, setSelectedMood] = React.useState<Mood | null>(null);
  const [topic, setTopic] = React.useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
      >
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">How are you feeling?</h2>
        <p className="text-center text-gray-500 mb-6">Select your current mood</p>

        <div className="grid grid-cols-5 gap-3 mb-6">
          {moods.map((mood) => (
            <motion.button
              key={mood.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                selectedMood === mood.value
                  ? 'bg-teal-100 ring-2 ring-teal-500'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-3xl mb-1">{mood.emoji}</span>
              <span className="text-xs text-center font-medium text-gray-700">{mood.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to talk about? (optional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Homesickness, Academic pressure..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => selectedMood && onSelect(selectedMood, topic)}
          disabled={!selectedMood || isLoading}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Starting...' : 'Start Session'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
