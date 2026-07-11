import type { Group } from '../types';

export const DEMO_GROUPS: Group[] = [
  {
    id: 'demo-ski-trip',
    name: 'Ski Trip ❄️',
    description: 'Annual winter getaway with friends. Lodging, lift tickets, dinners, and gas.',
    currency: '$',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    members: [
      { id: 'm1', name: 'Alex' },
      { id: 'm2', name: 'Jordan' },
      { id: 'm3', name: 'Taylor' },
      { id: 'm4', name: 'Morgan' },
    ],
    expenses: [
      {
        id: 'e1',
        title: 'Cabin Lodge Booking',
        amount: 800,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidById: 'm3', // Taylor paid
        categoryId: 'Lodging',
        splitType: 'equal',
        splits: [
          { memberId: 'm1', amount: 200 },
          { memberId: 'm2', amount: 200 },
          { memberId: 'm3', amount: 200 },
          { memberId: 'm4', amount: 200 },
        ],
        notes: 'Beautiful 3-bedroom cabin with a hot tub.',
      },
      {
        id: 'e2',
        title: 'Groceries & Smores',
        amount: 160,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidById: 'm1', // Alex paid
        categoryId: 'Food',
        splitType: 'equal',
        splits: [
          { memberId: 'm1', amount: 40 },
          { memberId: 'm2', amount: 40 },
          { memberId: 'm3', amount: 40 },
          { memberId: 'm4', amount: 40 },
        ],
        notes: 'Snacks, breakfasts, and roasting supplies.',
      },
      {
        id: 'e3',
        title: 'Car Rental Gas',
        amount: 75,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidById: 'm2', // Jordan paid
        categoryId: 'Transport',
        splitType: 'equal',
        splits: [
          { memberId: 'm1', amount: 18.75 },
          { memberId: 'm2', amount: 18.75 },
          { memberId: 'm3', amount: 18.75 },
          { memberId: 'm4', amount: 18.75 },
        ],
      },
      {
        id: 'e4',
        title: 'Ski Gear Rental (Alex & Morgan only)',
        amount: 120,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidById: 'm4', // Morgan paid
        categoryId: 'Entertainment',
        splitType: 'equal',
        splits: [
          { memberId: 'm1', amount: 60 },
          { memberId: 'm4', amount: 60 },
        ],
        notes: 'Taylor and Jordan brought their own gear.',
      },
      {
        id: 'e5',
        title: 'Steak House Dinner',
        amount: 240,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidById: 'm1', // Alex paid
        categoryId: 'Food',
        splitType: 'unequal',
        splits: [
          { memberId: 'm1', amount: 80 }, // Alex had steak + drinks
          { memberId: 'm2', amount: 50 },
          { memberId: 'm3', amount: 60 },
          { memberId: 'm4', amount: 50 },
        ],
        notes: 'Splitting dinner based on what we ordered.',
      }
    ],
  },
  {
    id: 'demo-roommates',
    name: 'Roommates 🏠',
    description: 'Shared household expenses, monthly rent difference, and utilities.',
    currency: '$',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    members: [
      { id: 'r1', name: 'Sam' },
      { id: 'r2', name: 'Casey' },
      { id: 'r3', name: 'Jamie' },
    ],
    expenses: [
      {
        id: 're1',
        title: 'High-Speed Internet',
        amount: 90,
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidById: 'r1',
        categoryId: 'Utilities',
        splitType: 'equal',
        splits: [
          { memberId: 'r1', amount: 30 },
          { memberId: 'r2', amount: 30 },
          { memberId: 'r3', amount: 30 },
        ],
      },
      {
        id: 're2',
        title: 'Cleaning Supplies & Toilet Paper',
        amount: 45,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paidById: 'r2',
        categoryId: 'Shopping',
        splitType: 'equal',
        splits: [
          { memberId: 'r1', amount: 15 },
          { memberId: 'r2', amount: 15 },
          { memberId: 'r3', amount: 15 },
        ],
      }
    ],
  },
];
