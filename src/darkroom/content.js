/* =============================================================
   The written parts of the room.

   Every box of film ships with a technical data sheet: what the
   stock is, what it does, what to expect from it. This page has
   one too, and it is the plainest thing here on purpose. A visitor
   who wants the photograph gets the contact sheet; a visitor who
   wants the facts should not have to hunt for them.
   ============================================================= */

export const SHEET_META = 'TECHNICAL DATA · P. MHASKE · REV. JULY 2026'

/* Stated plainly, because everything else on this page is a
   photograph. Order is what a stranger asks in: who, where,
   what now, what before, what with. */
export const DATA_SHEET = [
  ['Name', 'Parth Mhaske. College Park, Maryland.'],
  [
    'Studying',
    'University of Maryland, College Park. Computer science and applied mathematics, class of 2028.',
  ],
  [
    'Now',
    'Software engineering intern at Corsha, working on backend machine-identity authentication for operational technology networks.',
  ],
  [
    'Research',
    'MASS Lab, UT Austin (2025–2026) · Astronomy, University of Maryland · Computational Social Dynamics Lab · Population Biology Laboratory, IISER Pune',
  ],
  [
    'Robotics',
    'Science Olympiad Robot Tour, third at the 2024 National Tournament · Electrical Director, FRC Team 1923',
  ],
  [
    'Published',
    'Suspension Parameter Optimization in a Paramotor UAV Using Monte Carlo Analysis, 2026 AIAA Aviation Forum (DOI 10.2514/6.2026-4336).',
  ],
  [
    'Works in',
    'Python, C++, C, Java, JavaScript, R, LaTeX · NumPy, SciPy, scikit-learn, pandas, Matplotlib, TensorFlow · Git, Linux, Jupyter, FastAPI, PostGIS, GeoPandas, React',
  ],
  [
    'Methods',
    'Monte Carlo simulation, ODE modeling, PID control, sensor fusion, A* search, logistic regression, k-means, ABC calibration',
  ],
  [
    'Looking for',
    'Summer 2028 internships in quantitative research or systems engineering. Available to talk now.',
  ],
]

/* Five numbers a recruiter can read in about eight seconds. Each
   one belongs to a frame further down, and each one is a count of
   something rather than an adjective. */
export const RESULTS = [
  ['4,000', 'landing trials simulated', '74.9% finished inside tolerance'],
  ['6.2×', 'faster than my serial version', 'parallel Monte Carlo pipeline'],
  ['3rd', 'Science Olympiad Nationals, 2024', '16×16 maze, 1 kHz control loop'],
  ['35k+', 'papers classified', 'TF-IDF into logistic regression and an SVM'],
  ['600k+', 'traders analyzed', 'Polymarket, against resolved outcomes'],
]

/* What is actually happening this month. Dated on purpose: an
   undated "currently" line is worth nothing. */
export const BENCH = [
  ['Building', 'A C++ order book I keep rewriting, because I keep finding out that the previous definition of "fast" was wrong.'],
  ['Stuck on', 'Getting the UAV model to agree with the two real landings I have footage of. It does not agree yet.'],
  ['Reading', 'Norton, Fighting Traffic. It is the book the whole street-design argument is with.'],
  ['Unexposed', 'Frame 16. I left one on the roll on purpose.'],
]

/* The apparatus list that used to sit under "Self" is gone: it was
   the same tools and methods the data sheet already lists, printed
   a second time three screens further down. "Looking for" left the
   bench for the same reason — it is in the hero, on the data sheet,
   and in the correspondence room. */

export const CHANNELS = [
  ['Email', 'pmhaske@umd.edu', 'mailto:pmhaske@umd.edu'],
  ['LinkedIn', 'linkedin.com/in/parthmhaske667', 'https://linkedin.com/in/parthmhaske667'],
  ['GitHub', 'github.com/parthm667', 'https://github.com/parthm667'],
  ['Photography', 'parthmhaske.myportfolio.com', 'https://parthmhaske.myportfolio.com/'],
]
