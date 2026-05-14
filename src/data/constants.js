import { Brain, Activity, HeartPulse, Flame, Dumbbell } from 'lucide-react';

// src/data/constants.js

export const INITIAL_ATHLETES = [
  {
    id: 'a1',
    name: 'McCarthy, Dillan',
    birthYear: 2001,
    height: 182, // الطول بالسنتيمتر
    weight: 82,
    bodyFat: 12,
    verticalJump: 65, // الوثب العمودي بالسنتيمتر
    clean: 110,
    halfSquat: 160,
    quarterSquat: 190,
    bench: 100,
  },
  {
    id: 'a2',
    name: 'Johnson, Sarah',
    birthYear: 2005,
    height: 165,
    weight: 65,
    bodyFat: 18,
    verticalJump: 50,
    clean: 75,
    halfSquat: 110,
    quarterSquat: 130,
    bench: 55,
  },
];

// ... (باقي الكود القديم مثل DRILL_TYPES و INITIAL_SCHEDULE يبقى كما هو)

export const DRILL_TYPES = {
  cognitive: {
    label: 'Cognitive',
    icon: Brain,
    color: 'text-purple-500',
    border: 'border-purple-400',
  },
  physical: {
    label: 'Physical',
    icon: Activity,
    color: 'text-blue-500',
    border: 'border-blue-400',
  },
  recovery: {
    label: 'Recovery',
    icon: HeartPulse,
    color: 'text-green-500',
    border: 'border-green-400',
  },
  warmup: {
    label: 'Warm Up',
    icon: Flame,
    color: 'text-red-500',
    border: 'border-red-400',
  },
  strength: {
    label: 'Strength',
    icon: Dumbbell,
    color: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500',
  },
};

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const INITIAL_LIBRARY = {
  templates: [
    {
      id: 'tpl-1',
      title: 'Full Isometric Day',
      type: 'strength',
      drills: [
        {
          type: 'warmup',
          title: 'General Warm Up',
          details: '10 mins jogging',
          percentage: '',
        },
        {
          type: 'strength',
          title: 'Manual Isometric Hold',
          details: '4 x 45 secs',
          percentage: '80',
        },
        {
          type: 'physical',
          title: 'Plank Walkout',
          details: '3 x 10',
          percentage: '',
        },
      ],
    },
    {
      id: 'tpl-2',
      title: 'Speed & Agility Day',
      type: 'physical',
      drills: [
        {
          type: 'warmup',
          title: 'Dynamic Stretches',
          details: '1 round',
          percentage: '',
        },
        {
          type: 'physical',
          title: 'Sprint Development: Side',
          details: '1 round - 2x25m',
          percentage: '100',
        },
        {
          type: 'physical',
          title: 'Acceleration Development',
          details: '1 set - 6x20m',
          percentage: '95',
        },
      ],
    },
  ],
  drills: [
    {
      id: 'lib-1',
      type: 'strength',
      title: 'Barbell Back Squat',
      details: '5 x 5 - Pause 3 seconds',
      percentage: '70',
    },
    {
      id: 'lib-2',
      type: 'strength',
      title: 'RDL (Romanian Deadlift)',
      details: '4 x 5 - 3 second lower',
      percentage: '75',
    },
    {
      id: 'lib-3',
      type: 'warmup',
      title: 'Jump Dynamic Flexibility',
      details: '1 round',
      percentage: '',
    },
    {
      id: 'lib-4',
      type: 'cognitive',
      title: 'Static Flexibility: Ammo',
      details: '1 round - 40 seconds ea.',
      percentage: '',
    },
    {
      id: 'lib-5',
      type: 'recovery',
      title: 'Rest Day',
      details: 'Focus on mobility',
      percentage: '',
    },
  ],
};

export const INITIAL_SCHEDULE = {
  Sunday: [
    {
      id: 'w0',
      type: 'recovery',
      title: 'Rest Day',
      details: 'Focus on mobility',
      percentage: '',
    },
  ],
  Monday: [
    {
      id: 'w1',
      type: 'warmup',
      title: 'Manual Isometric Hold',
      details: '4 x 45 secs',
      percentage: '',
    },
    {
      id: 'w2',
      type: 'physical',
      title: 'Sprint Development: Pistol',
      details: '1 round - x10',
      percentage: '90',
    },
    {
      id: 'w3',
      type: 'strength',
      title: 'Barbell Back Squat',
      details: '5 x 5 - Pause 3 seconds',
      percentage: '70',
    },
  ],
  Tuesday: [
    {
      id: 'w4',
      type: 'strength',
      title: 'Manual Isometric Hold',
      details: '4 x 45 secs',
      percentage: '',
    },
    {
      id: 'w5',
      type: 'warmup',
      title: 'General Warm Up',
      details: "Jog, Bike, or Row for 5-10'",
      percentage: '',
    },
    {
      id: 'w6',
      type: 'cognitive',
      title: 'Static Flexibility: Ammo',
      details: '1 round - 40 seconds ea.',
      percentage: '',
    },
    {
      id: 'w7',
      type: 'physical',
      title: 'Sprint Development: Side',
      details: '1 round - 2x25m',
      percentage: '100',
    },
    {
      id: 'w8',
      type: 'strength',
      title: 'Barbell Circuit: Lower',
      details: '1 round - x10 ea',
      percentage: '60',
    },
  ],
  Wednesday: [],
  Thursday: [],
  Friday: [
    {
      id: 'w9',
      type: 'strength',
      title: 'Clean Pull',
      details: '5 x 4 - last 3 @ 100% of power clean',
      percentage: '100',
    },
    {
      id: 'w10',
      type: 'strength',
      title: 'RDL (Romanian Deadlift)',
      details: '4 x 5 - 3 second lower',
      percentage: '80',
    },
  ],
  Saturday: [],
};
