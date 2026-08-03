/* =============================================================
   THE ROLL

   One roll of film. Sixteen exposures, in the order they happened,
   which is why a heron sits next to an order book.

   Frames are the navigation. Add a frame here and it appears on the
   contact sheet, in the reel, in the index of exposures, and under
   the loupe. `gen` names a procedural renderer in emulsion.js;
   `keeper` earns a chinagraph circle on the sheet.

   Two names per frame, on purpose. `title` is the caption a
   photographer would write on the back of the print, and it is what
   the contact sheet shows. `subject` is what the frame actually is,
   in the words someone scanning for a hire would use, and it is
   what the work ledger and the enlargement lead with. `role` gives
   the organization and the dates. Nothing important is left as a
   riddle.
   ============================================================= */

export const ROLL = [
  {
    n: '1',
    id: 'self',
    title: 'Self, with bad posture',
    subject: 'Parth Mhaske',
    role: 'College Park, Maryland',
    kind: 'SELF',
    gen: 'portrait',
    exposure: 'HP5+ · f/2 · 1/60 · COLLEGE PARK, MD',
    keeper: true,
    note: 'the only one\nI didn\'t take',
    print: {
      deck: 'Computer science and applied mathematics at the University of Maryland, class of 2028.',
      body: [
        'Most of what I build has to decide before it knows enough. A drone picks a moment to land in wind it can only estimate, a robot drives a maze it cannot see, and an order book has microseconds to commit. In all three cases the average case is fine, and the average case is not what hurts you, so most of what I actually do is run the thing ten thousand times, count how often it is wrong, and try to make it wrong less often.',
        'Right now I am a software engineering intern at Corsha, where I do backend work on machine-identity authentication for operational technology networks. In plain terms, I help make sure a robot arm can prove that it is the robot arm. Before that I modeled UAV landings at UT Austin\'s MASS Lab, fit stochastic models to ranking data in a computational social dynamics lab, built a light-scattering model for circumstellar dust in Maryland\'s astronomy department, and trained literature classifiers at IISER Pune.',
        'Away from a screen I ride a bike and I photograph birds on film. Both are on this roll, and neither is a hobby I put on a website to seem interesting. The heron on frame 2 took forty minutes of standing in a marsh at dawn, and it is one of about four keepers from that entire roll. Frame 6 is the crash that turned into frame 8.',
      ],
      stat: [['SCHOOL', 'UMD'], ['CLASS', '2028'], ['NOW', 'Corsha'], ['SEEKING', 'S28 intern']],
      links: [['Résumé', '/resume.pdf'], ['GitHub', 'https://github.com/parthm667'], ['Email', 'mailto:pmhaske@umd.edu']],
    },
  },
  {
    n: '2',
    id: 'heron',
    title: 'Great blue heron, holding still longer than I could',
    subject: 'Wildlife on film',
    role: 'Patuxent, Maryland',
    kind: 'WILD',
    gen: 'heron',
    exposure: '600mm · f/4 · 1/1600 · ISO 800 · PATUXENT, MD',
    keeper: true,
    note: 'waited 40 min',
    print: {
      deck: 'Thirty-six frames to a roll makes you wait for the bird instead of spraying at it.',
      body: [
        'Digital would be easier and I would be worse at it. A roll is a budget, and a budget is the only thing that ever taught me to sit still in wet grass for forty minutes.',
        'This one came off a 64 km ride down the C&O towpath, which is why the camera comes along on the long ones. The two hobbies keep handing each other material.',
        'To be clear about what you are looking at: the heron above is drawn, not scanned. I have the real frame, and it did not sit right against the rest of this page, so what is on the sheet is an illustration of the shot rather than the shot. The photographs themselves are on the photography site.',
      ],
      stat: [['LENS', '600mm'], ['STOP', 'f/4'], ['SPEED', '1/1600'], ['WAIT', '40 min']],
      links: [['Photography site', 'https://parthmhaske.myportfolio.com/']],
    },
  },
  {
    n: '3',
    id: 'uav',
    title: 'Four thousand landings, one deck',
    subject: 'UAV landing-gear optimization under uncertain wind',
    role: 'Research intern, MASS Lab, UT Austin · 2025–2026',
    kind: 'WORK',
    gen: 'dispersion',
    exposure: 'MASS LAB, UT AUSTIN · 4,000 TRIALS · AIAA 2026',
    stack: ['Python', 'C++', 'ODE modeling', 'parallel Monte Carlo'],
    print: {
      deck: 'Four thousand simulated landings on a deck that will not hold still.',
      body: [
        'A quadrotor coming down onto a ship deck has to commit. Somewhere above the deck it stops hedging and starts descending, and from that moment the wind gets a vote it cannot take back. The controller is not the interesting part. What matters is the tail: the fraction of approaches where an ordinary gust arrives at the worst possible instant.',
        'A nominal simulation cannot answer that, because the nominal case always works. Instead, we modeled the impact as a spring-mass-damper system with vertical, roll, and pitch degrees of freedom, sampled the touchdown conditions (height, vertical velocity, pitch angle, and roll angle), and flew the landing 4,000 times. We define a successful trial as one in which the spring never compresses past its solid length and the peak force stays below the frame\'s failure threshold.',
        '74.9% of the trials finished inside tolerance. The cloud of touchdowns is also not centered: there is a persistent quarter-meter downwind bias that took me an embarrassingly long time to accept was real and not a sign error. The parallel pipeline runs 6.2× faster than the serial loop I started with, which mattered less as a number than as a change in behavior, because a full sweep went from overnight to lunch and I started asking more questions.',
      ],
      wrong: 'I modeled the wind as stationary. Real gusts near a moving ship are not stationary, and they are not independent of the deck either, which is exactly the case where my numbers are optimistic. I have footage of two real landings and the model reproduces neither. That is the top item on my desk.',
      stat: [['TRIALS', '4,000'], ['IN TOLERANCE', '74.9%'], ['SPEEDUP', '6.2×'], ['VENUE', 'AIAA 2026']],
      links: [['Source and notebooks', 'https://github.com/parthm667/UAVSuspensionSystem']],
    },
  },
  {
    n: '4',
    id: 'night-ride',
    title: 'Route 1 at 5 a.m., before the traffic',
    subject: 'Route 1 before dawn',
    role: 'College Park, Maryland',
    kind: 'RIDE',
    gen: 'nightroad',
    exposure: 'ROUTE 1 · 31.2 KM · 4:58 AM · 3 °C',
    keeper: true,
    note: 'best light\nall year',
    print: {
      deck: 'Empty road, no cars, and the only hour when the shoulder belongs to you.',
      body: [
        'I race, I commute, and somewhere in between I got interested in why American roads are built the way they are. Most of what I know about street design I learned by riding on badly designed roads in the dark.',
        '31.2 km, three degrees, and nobody else awake. The shoulder is the same width at five in the morning as it is at five in the afternoon. The difference is entirely who else is using it.',
        'I wrote the longer argument out with the data behind it. The essay is linked below.',
      ],
      stat: [['DISTANCE', '31.2 km'], ['START', '4:58 AM'], ['TEMP', '3 °C'], ['TRAFFIC', 'none']],
      links: [['Read the essay', '/public_remediation']],
    },
  },
  {
    n: '5',
    id: 'maze',
    title: 'A robot that cannot see the walls',
    subject: 'Blind maze-solving robot: A* planner and cascaded PID',
    role: 'Science Olympiad Robot Tour · 2023–2024',
    kind: 'WORK',
    gen: 'maze',
    exposure: 'SCIENCE OLYMPIAD · 16×16 · 1 kHz · 3RD NATIONALS 2024',
    stack: ['PID control', 'IMU sensor fusion', 'A* search', 'Python'],
    print: {
      deck: 'Plan on paper, execute blind, and charge the planner for every turn.',
      body: [
        'You get the maze on paper ten minutes before the run. The robot has wheels, encoders, and an IMU, and nothing at all that senses a wall. So the whole problem is to plan a route offline and then execute it accurately enough, blind, that you never need to sense one.',
        'A plain shortest-path planner hands you a staircase: twenty alternating turns across open floor, all technically optimal. On a blind robot that is a disaster, because every turn is another independent chance to accumulate heading error. Instead, I made the cost function charge for turning, g = steps + 0.6 · turns. The 0.6 is not principled. I tuned it on the practice maze until the routes stopped looking nervous.',
        'The controller was the other half. Encoders lie under wheel slip, and they lied differently every run, so the tuning that won practice would lose the next heat. Fusing them with the IMU did more than reduce the error: the same gains that oscillated on odometry alone came out properly damped once the estimate stopped being noisy. The final robot ran cascaded PID at 1 kHz over a 16×16 grid.',
      ],
      wrong: 'We placed third at nationals. The second run finished about four centimeters long, which on that sheet is the difference between third and first. It was not the planner and it was not the filter. We changed the battery between runs, and a fresher pack meant slightly more speed into every segment. I had never characterized the controller against supply voltage. I think about that more than the placing.',
      stat: [['GRID', '16×16'], ['LOOP', '1 kHz'], ['PLACE', '3rd'], ['TURN COST', '0.6']],
      links: [['Source', 'https://github.com/parthm667/RobotTourMazeSolver']],
    },
  },
  {
    n: '6',
    id: 'crash',
    title: 'March 2022',
    subject: 'March 2022, and what it turned into',
    role: 'New Jersey · March 2022',
    kind: 'RIDE',
    gen: 'damaged',
    exposure: 'MARCH 2022 · DAMAGED IN PROCESSING · DO NOT REPRINT',
    damaged: true,
    note: 'kept it',
    print: {
      deck: 'The only exposure on this roll that changed what I work on.',
      body: [
        'I was hit by a car. I got up, the bike did not, and for a while afterward I was angry at a driver.',
        'Then I read enough to understand that the road had been built to produce roughly that outcome: lanes wide enough that forty feels like twenty-five, a crossing placed where the manual said traffic wanted it rather than where people actually walk, and a design speed chosen decades before anyone lived there. Around 7,500 pedestrians are killed on American roads a year. The Netherlands cut its rate by roughly three quarters over the same stretch of time in which the United States raised its own. That gap is not an accident rate. It is a design outcome, and design outcomes have authors.',
        'Two things came out of this frame. One is the High Injury Network generator on frame 8, which is the part that turned into engineering. The other is a long essay on street design, linked below. I kept this negative even though the emulsion lifted off two thirds of it.',
      ],
      stat: [['FRAME', 'damaged'], ['KEPT', 'yes'], ['REPRINT', 'no'], ['LED TO', 'frame 8']],
      links: [['Read the essay', '/public_remediation'], ['The generator', 'https://github.com/parthm667/nj-hin-generator']],
    },
  },
  {
    n: '7',
    id: 'orderbook',
    title: 'An order book at depth',
    subject: 'Low-latency C++ order book',
    role: 'Smith Investment Fund',
    kind: 'WORK',
    gen: 'orderbook',
    exposure: 'SMITH INVESTMENT FUND · C++ · p99 TARGET',
    stack: ['C++20', 'low-latency systems', 'profiling'],
    print: {
      deck: 'An order book, and finding out what fast means.',
      body: [
        'I keep rewriting a C++ order book, and each rewrite is really me discovering that the previous definition of fast was wrong. First it was algorithmic, because I had the wrong data structure. Then it was allocation. Then it was cache lines. Now it is mostly about not doing anything at all on the hot path.',
        'The part nobody warns you about is that the median stops being interesting almost immediately. Everything worth optimizing lives in the p99, which is the same lesson as the UAV work in a different costume: the average case is fine, and the average case is not what hurts you. The team repository targets the crypto.com exchange and is written in C++20.',
      ],
      wrong: 'I spent two weeks optimizing a path that profiling later showed was 3% of the runtime. I had assumed instead of measured, which is exactly the thing I would have told someone else not to do.',
      stat: [['LANGUAGE', 'C++20'], ['TARGET', 'p99'], ['STATUS', 'rewriting'], ['LESSON', 'measure']],
      links: [['Repository', 'https://github.com/sujaykonda/crypto-hft']],
    },
  },
  {
    n: '8',
    id: 'hin',
    title: 'Every place someone was hit, in one state',
    subject: 'New Jersey High Injury Network generator',
    role: 'New Jersey municipalities · SS4A grant workflows',
    kind: 'WORK',
    gen: 'roads',
    exposure: 'NEW JERSEY · POISSON SIGNIFICANCE · POSTGIS · FASTAPI',
    keeper: true,
    note: 'this one\nmatters',
    stack: ['FastAPI', 'PostGIS', 'GeoPandas', 'React', 'Leaflet'],
    print: {
      deck: 'Every place someone was hit, in one state, ranked so a town can point money at it.',
      body: [
        'A High Injury Network is the small share of a road system where most of the serious crashes happen. It is usually under 10% of the miles. If you can find it, you can point money at it, which is what federal Safe Streets and Roads for All grants are for. Most towns cannot produce one, because the crash data arrives as a mess of inconsistent geocoding.',
        'So I built a generator. It assigns crashes to road segments, runs Poisson significance testing so that a segment is not flagged merely for being long or busy, overlays equity data, and exports the maps and tables a grant application can actually use. The back end is FastAPI over PostGIS with GeoPandas doing the spatial work, and the front end is React and Leaflet.',
        'This is the only thing on this roll that has users who are not me.',
      ],
      wrong: 'The equity overlay is the part I am least sure of. Choosing which demographic layers count, and how much, is a policy judgment I made in a Python file at 2 a.m., and it deserves better than that.',
      stat: [['STATE', 'NJ'], ['METHOD', 'Poisson'], ['STACK', 'PostGIS'], ['USERS', 'real']],
      links: [['Source', 'https://github.com/parthm667/nj-hin-generator'], ['Why it exists', '/public_remediation']],
    },
  },
  {
    n: '9',
    id: 'comet',
    title: 'Dust around a star that is not ours',
    subject: 'Light-scattering model for circumstellar dust',
    role: 'Astronomy, University of Maryland',
    kind: 'WORK',
    gen: 'comet',
    exposure: 'UMD ASTRONOMY · POLARIMETRY · SCATTERING MODEL',
    stack: ['Monte Carlo', 'scientific computing', 'Python'],
    print: {
      deck: 'Working backward from polarized light to the dust that scattered it.',
      body: [
        'Light that bounces off dust comes back polarized, and how it is polarized depends on the size, shape, and composition of the grains it bounced off. So if you measure the polarization carefully enough, you can work backward to what the dust is without ever going there.',
        'My part was the forward model. We scatter light off populations of synthetic grains, produce the photometry and polarimetry you would expect to observe, and compare that against what was actually observed. Mostly it is Monte Carlo, which by this point in the roll you will have noticed is most of what I do.',
      ],
      wrong: 'Grain shape is the parameter the result is most sensitive to and the one we know least about. It is easy to fit the data with the wrong grains.',
      stat: [['METHOD', 'polarimetry'], ['MODEL', 'scattering'], ['DOMAIN', 'circumstellar'], ['TOOL', 'Monte Carlo']],
      links: [],
    },
  },
  {
    n: '10',
    id: 'ranking',
    title: 'What a ranking does to the thing it ranks',
    subject: 'Popularity bias in online markets',
    role: 'Computational Social Dynamics Lab',
    kind: 'WORK',
    gen: 'rankflow',
    exposure: 'AGENT-BASED · MONTE CARLO SWEEP · ABC CALIBRATION',
    stack: ['agent-based modeling', 'Monte Carlo', 'ABC calibration'],
    print: {
      deck: 'How much of a final ranking is quality, and how much is just having gone first.',
      body: [
        'Put a list in front of people in a particular order and the order starts to cause the thing it claims to describe. Whatever sits near the top gets seen, gets picked, and stays near the top. The question worth answering is how much of a final ranking is quality and how much is the head start.',
        'We built stochastic simulations of choice under social influence, ran large Monte Carlo sweeps across the parameter space, and calibrated them against real ranking data using approximate Bayesian computation rather than eyeballing the curves. ABC is the right tool here because the likelihood is not tractable: you can simulate the ranking process forward, but you cannot write down the probability of an observed ranking in closed form.',
      ],
      stat: [['METHOD', 'Monte Carlo'], ['MODEL', 'agent-based'], ['FIT', 'ABC'], ['DATA', 'rankings']],
      links: [],
    },
  },
  {
    n: '11',
    id: 'corpus',
    title: 'Thirty-five thousand papers, sorted',
    subject: 'Literature classification over 35,000+ papers',
    role: 'Population Biology Laboratory, IISER Pune',
    kind: 'WORK',
    gen: 'corpus',
    exposure: 'IISER PUNE · 35k+ PAPERS · TF-IDF · LOGREG + SVM',
    stack: ['scikit-learn', 'TF-IDF', 'GridSearchCV', 'SVM'],
    print: {
      deck: 'Past about a thousand papers, a literature review stops being reading and becomes a classification problem.',
      body: [
        'The lab needed the relevant work out of a corpus of more than 35,000 papers, so the job was the pipeline that decides. I built TF-IDF features into logistic regression and an SVM, and tuned both with grid search under cross-validation so that the number I reported was not the number I fit on.',
        'A quiet share of the effort went into metadata repair. Real bibliographic records arrive with missing years, duplicated entries, and authors spelled four different ways, and none of the modeling means anything until that is fixed.',
      ],
      stat: [['CORPUS', '35k+'], ['FEATURES', 'TF-IDF'], ['MODELS', 'LogReg · SVM'], ['TUNING', 'GridSearch']],
      links: [],
    },
  },
  {
    n: '12',
    id: 'night-window',
    title: 'Rain on the glass, 2:47 a.m.',
    subject: 'How this page was made',
    role: 'Colophon',
    kind: 'NIGHT',
    gen: 'rainwindow',
    exposure: 'COLOPHON · 16 FRAMES DRAWN IN CANVAS · NO STOCK',
    keeper: true,
    note: 'the room,\nphotographing itself',
    print: {
      deck: 'Every photograph here was drawn in a canvas, in grayscale, and then put through an emulsion curve.',
      body: [
        'There is no stock photography on this page. Every frame on the roll is procedural: the heron is bezier curves, the order book is a loop, the corpus is a grid of paper slips either side of a decision boundary, and frame 6 is a night road with two thirds of the emulsion removed by a destination-out composite. Only the portrait starts from a real photograph.',
        'One shared post-process then does what film does. It applies an exposure stop per frame, an S-curve blended toward linear so that the toe keeps its shadow detail, grain whose amplitude peaks in the midtones, and a vignette painted after the grain so that the vignette does not get speckled.',
        'A print does not fade in, so nothing here fades in. The dense areas surface first and the highlights arrive last, so the develop sweeps a density threshold rather than an alpha, with a per-pixel noise term to roughen the edge. The tone curve and the grain are baked once into a Float32Array, which means the per-frame work is a threshold and a write. That is also why the grain does not crawl.',
      ],
      stat: [['FRAMES', '16'], ['STOCK', 'none'], ['TYPEFACES', '4'], ['REQUESTS', 'first-party']],
      links: [],
    },
  },
  {
    n: '13',
    id: 'scope',
    title: 'A bus that is supposed to be square',
    subject: 'Robot electrical systems: CAN and encoder signal integrity',
    role: 'Electrical Director, FRC Team 1923',
    kind: 'WORK',
    gen: 'scope',
    exposure: 'FRC TEAM 1923 · ELECTRICAL DIRECTOR · CAN + ENCODERS',
    stack: ['electrical design', 'CAN diagnostics', 'autonomous strategy'],
    print: {
      deck: 'Every failure that is not obviously mechanical and not obviously code arrives at your bench.',
      body: [
        'Electrical director is a job defined by exclusion. Most of a season is signal integrity: CAN wiring, encoder lines, and the connectors that pass a continuity test on the cart and then drop a device in the middle of a match.',
        'I led the electrical system design and the diagnostics, and I stayed on the strategy side as well, on autonomous routines and the match-level calls about what to attempt. Which is the same question as everything else on this roll: what does the thing do when it only has part of the information.',
      ],
      stat: [['ROLE', 'electrical'], ['BUS', 'CAN'], ['SENSORS', 'encoders'], ['ALSO', 'autonomous']],
      links: [],
    },
  },
  {
    n: '14',
    id: 'odds',
    title: 'Six hundred thousand people, betting',
    subject: 'Polymarket trader analysis, 600,000+ accounts',
    role: 'Personal project',
    kind: 'WORK',
    gen: 'odds',
    exposure: 'PERSONAL · 600k+ TRADERS · PYTHON · JUPYTER',
    stack: ['pandas', 'Jupyter', 'k-means', 'hypothesis testing'],
    print: {
      deck: 'A market where everybody eventually gets graded.',
      body: [
        'Given a dataset of about 600,000 Polymarket traders, I wanted to figure out what separated the profitable ones from everyone else. However, this was not time-series data where I could predict what happens next. It was a snapshot of trader performance. Therefore I focused on what makes successful traders successful, so that the behavior could be copied.',
        'The first thing I did was look at correlations. Volume had the highest at 0.41, which seemed like the obvious answer. But I knew it could not just be this obvious, so I split everyone into volume deciles to see who actually makes money, and almost all of the profit sat in the top decile while the lower nine lost money on average. So volume is not much use unless you already have a lot of it.',
        'This meant I had to look for skill-based edges instead of capital-based ones. From there I moved to how specialized a trader is, how quickly they exit, and how much they make per dollar pushed through the market, and then ran k-means over those behavior features to see whether the findings showed up in the same traders.',
      ],
      stat: [['TRADERS', '600k+'], ['TOP CORR.', '0.41'], ['TOOL', 'Jupyter'], ['DATA', 'resolved']],
      links: [['Repository', 'https://github.com/parthm667/PolymarketAnalysis']],
    },
  },
  {
    n: '15',
    id: 'owl',
    title: 'Barred owl, unimpressed',
    subject: 'Barred owl, pushed film',
    role: 'Greenbelt, Maryland',
    kind: 'WILD',
    gen: 'owl',
    exposure: '600mm · f/5.6 · 1/200 · ISO 3200 · GREENBELT, MD',
    print: {
      deck: 'ISO 3200 at a two-hundredth of a second is not a combination anybody recommends.',
      body: [
        'It is what the light allowed. The grain that came back is the honest record of that decision rather than a filter applied afterward.',
        'The rest of the negatives are still waiting to be scanned.',
      ],
      stat: [['LENS', '600mm'], ['STOP', 'f/5.6'], ['SPEED', '1/200'], ['ISO', '3200']],
      links: [['More prints', 'https://parthmhaske.myportfolio.com/']],
    },
  },
  {
    n: '16',
    id: 'unexposed',
    title: 'Unexposed',
    subject: 'Open: summer 2028',
    role: 'July 2026',
    kind: '—',
    gen: 'unexposed',
    exposure: 'OPEN · SUMMER 2028 · QUANT RESEARCH OR SYSTEMS',
    note: 'on purpose',
    print: {
      deck: 'One frame left on the roll, on purpose.',
      body: [
        'Every roll should end with one you did not spend. This is that one, and what it is waiting for is a summer 2028 internship in quantitative research or systems engineering.',
        'If you have one of those, my email is in the correspondence section below.',
      ],
      stat: [['STATUS', 'open'], ['WANT', 'quant · systems'], ['WHEN', 'Summer 2028'], ['FRAME', 'unspent']],
      links: [['Email me', 'mailto:pmhaske@umd.edu'], ['Résumé', '/resume.pdf']],
    },
  },
]

export const byId = (id) => ROLL.find((f) => f.id === id)
export const KEEPERS = ROLL.filter((f) => f.keeper)

/* The nine research and engineering frames, in roll order. This is
   the whole of the technical record: nothing lives off the sheet. */
export const WORK = ROLL.filter((f) => f.kind === 'WORK')

/* Contact sheets come in strips. Four frames to a strip, sprocket
   holes above and below, which is what makes a sheet read as film
   rather than as a grid of cards. */
export const STRIPS = [ROLL.slice(0, 4), ROLL.slice(4, 8), ROLL.slice(8, 12), ROLL.slice(12, 16)]

export const ROLL_META = {
  stock: 'ILFORD HP5 PLUS',
  iso: '400',
  developed: 'JULY 2026',
  shooter: 'P. MHASKE',
  place: 'COLLEGE PARK, MD · 38.99° N, 76.94° W',
  frames: ROLL.length,
}
