export type CardColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export interface CardOption {
  color: CardColor;
  label: string; // e.g. "RED CARD"
  text: string;  // option description e.g. "A. Entertaining patients with video game mechanics"
  points: number; // e.g. 3
}

export interface RoundCardScheme {
  round: number;
  title: string;
  question: string;
  correctColor?: CardColor; // Marked correct/target scientific option
  cards: {
    RED: CardOption;
    BLUE: CardOption;
    GREEN: CardOption;
    YELLOW: CardOption;
  };
}

export const DEFAULT_CARD_SCHEMES: RoundCardScheme[] = [
  {
    round: 1,
    title: 'Interactive Round 1 (Question 1 / 5)',
    question: 'What is the primary role of Gamification in mHealth for chronic conditions like MS?',
    correctColor: 'BLUE',
    cards: {
      RED: {
        color: 'RED',
        label: 'RED CARD',
        text: 'A. Entertaining patients with video game mechanics',
        points: 3,
      },
      BLUE: {
        color: 'BLUE',
        label: 'BLUE CARD',
        text: 'B. Driving behavioral change & user engagement',
        points: 12,
      },
      GREEN: {
        color: 'GREEN',
        label: 'GREEN CARD',
        text: 'C. Replacing standard medical clinical care',
        points: 20,
      },
      YELLOW: {
        color: 'YELLOW',
        label: 'YELLOW CARD',
        text: 'D. Maximizing raw data collection for research',
        points: 7,
      },
    },
  },
  {
    round: 2,
    title: 'Interactive Round 2 (Question 2 / 5)',
    question: 'Why use a "Credit Balance Metaphor" (Stamina Credits) instead of raw clinical metrics?',
    correctColor: 'RED',
    cards: {
      RED: {
        color: 'RED',
        label: 'RED CARD',
        text: 'A. Simplifies complex bio-data into actionable mental models',
        points: 3,
      },
      BLUE: {
        color: 'BLUE',
        label: 'BLUE CARD',
        text: 'B. Makes the mobile app look like a mobile banking interface',
        points: 20,
      },
      GREEN: {
        color: 'GREEN',
        label: 'GREEN CARD',
        text: 'C. Completely hides fatigue severity from healthcare providers',
        points: 0,
      },
      YELLOW: {
        color: 'YELLOW',
        label: 'YELLOW CARD',
        text: 'D. Required strictly for medical device software certification',
        points: 17,
      },
    },
  },
  {
    round: 3,
    title: 'Interactive Round 3 (Question 3 / 5)',
    question: 'According to Self-Determination Theory (SDT), which needs drive long-term mHealth adherence?',
    correctColor: 'BLUE',
    cards: {
      RED: {
        color: 'RED',
        label: 'RED CARD',
        text: 'A. Extrinsic monetary rewards and financial gift cards',
        points: 0,
      },
      BLUE: {
        color: 'BLUE',
        label: 'BLUE CARD',
        text: 'B. Autonomy, Competence, and Psychological Relatedness',
        points: 3,
      },
      GREEN: {
        color: 'GREEN',
        label: 'GREEN CARD',
        text: 'C. Severe push notification penalties for missed entries',
        points: 11,
      },
      YELLOW: {
        color: 'YELLOW',
        label: 'YELLOW CARD',
        text: 'D. Public leaderboards comparing disability progression',
        points: 20,
      },
    },
  },
  {
    round: 4,
    title: 'Interactive Round 4 (Question 4 / 5)',
    question: 'What does an improving System Usability Scale (SUS) score over 60 days signify?',
    correctColor: 'BLUE',
    cards: {
      RED: {
        color: 'RED',
        label: 'RED CARD',
        text: 'A. The app automatically removed complex feature options',
        points: 20,
      },
      BLUE: {
        color: 'BLUE',
        label: 'BLUE CARD',
        text: 'B. Users adapted to UI patterns & gained operational fluency',
        points: 16,
      },
      GREEN: {
        color: 'GREEN',
        label: 'GREEN CARD',
        text: 'C. The underlying neurological MS pathology was cured',
        points: 3,
      },
      YELLOW: {
        color: 'YELLOW',
        label: 'YELLOW CARD',
        text: 'D. Initial technical software bugs were left completely ignored',
        points: 0,
      },
    },
  },
  {
    round: 5,
    title: 'Interactive Round 5 (Question 5 / 5)',
    question: 'How did More Stamina empower users beyond raw individual activity tracking?',
    correctColor: 'BLUE',
    cards: {
      RED: {
        color: 'RED',
        label: 'RED CARD',
        text: 'A. Providing automated AI medical diagnoses',
        points: 3,
      },
      BLUE: {
        color: 'BLUE',
        label: 'BLUE CARD',
        text: 'B. Facilitating communication with family and doctors',
        points: 7,
      },
      GREEN: {
        color: 'GREEN',
        label: 'GREEN CARD',
        text: 'C. Forcing 10,000 steps of daily mandatory exercise',
        points: 20,
      },
      YELLOW: {
        color: 'YELLOW',
        label: 'YELLOW CARD',
        text: 'D. Eliminating the necessity of clinical hospital visits',
        points: 0,
      },
    },
  },
];

export function getRoundCardScheme(schemes: RoundCardScheme[] | undefined, roundNumber: number): RoundCardScheme {
  const list = schemes && schemes.length > 0 ? schemes : DEFAULT_CARD_SCHEMES;
  const match = list.find((s) => s.round === roundNumber);
  if (match) return match;

  // If beyond specified schemes, cycle or provide default
  const index = (roundNumber - 1) % list.length;
  const base = list[index];
  return {
    ...base,
    round: roundNumber,
    title: `Interactive Round ${roundNumber}`,
  };
}

export function getPointsForCard(schemes: RoundCardScheme[] | undefined, roundNumber: number, color: CardColor): number {
  const scheme = getRoundCardScheme(schemes, roundNumber);
  return scheme.cards[color]?.points ?? 0;
}
