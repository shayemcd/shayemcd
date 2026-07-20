// Built-in exercise database mapping exercises to muscle groups.
// primary groups get full credit in day-type detection, secondary get partial.

export const GROUPS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
};

// [name, primary groups, secondary groups]
const DB = [
  // Chest
  ['Bench Press', ['chest'], ['triceps', 'shoulders']],
  ['Incline Bench Press', ['chest'], ['triceps', 'shoulders']],
  ['Decline Bench Press', ['chest'], ['triceps']],
  ['Dumbbell Bench Press', ['chest'], ['triceps', 'shoulders']],
  ['Incline Dumbbell Press', ['chest'], ['triceps', 'shoulders']],
  ['Machine Chest Press', ['chest'], ['triceps']],
  ['Dumbbell Fly', ['chest'], []],
  ['Cable Fly', ['chest'], []],
  ['Cable Crossover', ['chest'], []],
  ['Pec Deck', ['chest'], []],
  ['Push-Up', ['chest'], ['triceps', 'core']],
  ['Chest Dip', ['chest'], ['triceps']],

  // Back
  ['Deadlift', ['back', 'hamstrings', 'glutes'], ['forearms', 'core']],
  ['Rack Pull', ['back'], ['forearms', 'glutes']],
  ['Pull-Up', ['back'], ['biceps']],
  ['Chin-Up', ['back', 'biceps'], []],
  ['Lat Pulldown', ['back'], ['biceps']],
  ['Close-Grip Lat Pulldown', ['back'], ['biceps']],
  ['Barbell Row', ['back'], ['biceps', 'forearms']],
  ['Pendlay Row', ['back'], ['biceps']],
  ['Dumbbell Row', ['back'], ['biceps']],
  ['T-Bar Row', ['back'], ['biceps']],
  ['Seated Cable Row', ['back'], ['biceps']],
  ['Machine Row', ['back'], ['biceps']],
  ['Chest-Supported Row', ['back'], ['biceps']],
  ['Straight-Arm Pulldown', ['back'], []],
  ['Shrug', ['back'], ['forearms']],
  ['Face Pull', ['shoulders', 'back'], []],
  ['Good Morning', ['hamstrings', 'back'], ['glutes']],
  ['Back Extension', ['back', 'glutes'], ['hamstrings']],

  // Shoulders
  ['Overhead Press', ['shoulders'], ['triceps']],
  ['Seated Dumbbell Press', ['shoulders'], ['triceps']],
  ['Arnold Press', ['shoulders'], ['triceps']],
  ['Machine Shoulder Press', ['shoulders'], ['triceps']],
  ['Push Press', ['shoulders'], ['triceps', 'quads']],
  ['Lateral Raise', ['shoulders'], []],
  ['Cable Lateral Raise', ['shoulders'], []],
  ['Front Raise', ['shoulders'], []],
  ['Rear Delt Fly', ['shoulders'], ['back']],
  ['Upright Row', ['shoulders'], ['biceps']],

  // Biceps
  ['Barbell Curl', ['biceps'], ['forearms']],
  ['EZ-Bar Curl', ['biceps'], ['forearms']],
  ['Dumbbell Curl', ['biceps'], []],
  ['Hammer Curl', ['biceps', 'forearms'], []],
  ['Preacher Curl', ['biceps'], []],
  ['Incline Dumbbell Curl', ['biceps'], []],
  ['Cable Curl', ['biceps'], []],
  ['Concentration Curl', ['biceps'], []],
  ['Spider Curl', ['biceps'], []],

  // Triceps
  ['Close-Grip Bench Press', ['triceps'], ['chest', 'shoulders']],
  ['Tricep Pushdown', ['triceps'], []],
  ['Rope Pushdown', ['triceps'], []],
  ['Overhead Tricep Extension', ['triceps'], []],
  ['Skull Crusher', ['triceps'], []],
  ['Tricep Dip', ['triceps'], ['chest']],
  ['Tricep Kickback', ['triceps'], []],
  ['Diamond Push-Up', ['triceps'], ['chest']],

  // Forearms
  ['Wrist Curl', ['forearms'], []],
  ['Reverse Wrist Curl', ['forearms'], []],
  ['Reverse Curl', ['forearms', 'biceps'], []],
  ["Farmer's Carry", ['forearms'], ['core']],
  ['Dead Hang', ['forearms'], []],

  // Quads
  ['Squat', ['quads', 'glutes'], ['hamstrings', 'core']],
  ['Front Squat', ['quads'], ['glutes', 'core']],
  ['Goblet Squat', ['quads', 'glutes'], ['core']],
  ['Hack Squat', ['quads'], ['glutes']],
  ['Leg Press', ['quads', 'glutes'], ['hamstrings']],
  ['Leg Extension', ['quads'], []],
  ['Bulgarian Split Squat', ['quads', 'glutes'], ['hamstrings']],
  ['Lunge', ['quads', 'glutes'], ['hamstrings']],
  ['Walking Lunge', ['quads', 'glutes'], ['hamstrings']],
  ['Step-Up', ['quads', 'glutes'], []],
  ['Sissy Squat', ['quads'], []],
  ['Pistol Squat', ['quads', 'glutes'], ['core']],

  // Hamstrings
  ['Romanian Deadlift', ['hamstrings', 'glutes'], ['back']],
  ['Stiff-Leg Deadlift', ['hamstrings'], ['glutes', 'back']],
  ['Lying Leg Curl', ['hamstrings'], []],
  ['Seated Leg Curl', ['hamstrings'], []],
  ['Nordic Curl', ['hamstrings'], []],
  ['Glute-Ham Raise', ['hamstrings', 'glutes'], []],

  // Glutes
  ['Hip Thrust', ['glutes'], ['hamstrings']],
  ['Glute Bridge', ['glutes'], ['hamstrings']],
  ['Sumo Deadlift', ['glutes', 'hamstrings'], ['back', 'quads']],
  ['Cable Pull-Through', ['glutes'], ['hamstrings']],
  ['Glute Kickback', ['glutes'], []],
  ['Hip Abduction Machine', ['glutes'], []],

  // Calves
  ['Standing Calf Raise', ['calves'], []],
  ['Seated Calf Raise', ['calves'], []],
  ['Calf Press', ['calves'], []],
  ['Single-Leg Calf Raise', ['calves'], []],

  // Core
  ['Plank', ['core'], []],
  ['Side Plank', ['core'], []],
  ['Crunch', ['core'], []],
  ['Cable Crunch', ['core'], []],
  ['Sit-Up', ['core'], []],
  ['Bicycle Crunch', ['core'], []],
  ['Hanging Leg Raise', ['core'], []],
  ['Hanging Knee Raise', ['core'], []],
  ['Russian Twist', ['core'], []],
  ['Ab Wheel Rollout', ['core'], []],
  ['Dead Bug', ['core'], []],
  ['Mountain Climber', ['core'], []],
  ['V-Up', ['core'], []],
];

export const EXERCISES = DB.map(([name, primary, secondary]) => ({ name, primary, secondary }));

// Cardio activities: logged in minutes rather than sets/reps.
// MET values are used for calorie-burn estimates (js/energy.js).
export const CARDIO = [
  { name: 'Treadmill Run', met: 8.3, cardio: true },
  { name: 'Incline Walk', met: 5.0, cardio: true },
  { name: 'Stationary Bike', met: 6.8, cardio: true },
  { name: 'Rowing Machine', met: 7.0, cardio: true },
  { name: 'Elliptical', met: 5.0, cardio: true },
  { name: 'Stair Climber', met: 9.0, cardio: true },
  { name: 'Jump Rope', met: 11.0, cardio: true },
  { name: 'Stretching / Cool-down', met: 2.3, cardio: true },
];

export function findCardio(name) {
  const n = String(name).trim().toLowerCase();
  return CARDIO.find(c => c.name.toLowerCase() === n) || null;
}

// Curated ordered picks per muscle group for generated plans: weighted/
// machine-based movements, compounds first. Core list feeds the "abs" slot.
export const PLAN_PICKS = {
  chest: ['Bench Press', 'Incline Dumbbell Press', 'Machine Chest Press', 'Cable Fly'],
  back: ['Lat Pulldown', 'Seated Cable Row', 'Barbell Row', 'Machine Row'],
  shoulders: ['Seated Dumbbell Press', 'Lateral Raise', 'Machine Shoulder Press', 'Rear Delt Fly'],
  biceps: ['EZ-Bar Curl', 'Dumbbell Curl', 'Cable Curl', 'Hammer Curl'],
  triceps: ['Tricep Pushdown', 'Overhead Tricep Extension', 'Skull Crusher', 'Close-Grip Bench Press'],
  forearms: ['Reverse Curl', 'Wrist Curl'],
  quads: ['Squat', 'Leg Press', 'Leg Extension', 'Bulgarian Split Squat'],
  hamstrings: ['Romanian Deadlift', 'Seated Leg Curl', 'Lying Leg Curl', 'Good Morning'],
  glutes: ['Hip Thrust', 'Cable Pull-Through', 'Glute Kickback', 'Hip Abduction Machine'],
  calves: ['Standing Calf Raise', 'Seated Calf Raise'],
  core: ['Cable Crunch', 'Hanging Knee Raise', 'Plank', 'Ab Wheel Rollout', 'Russian Twist', 'Crunch'],
};

const byLowerName = new Map(EXERCISES.map(e => [e.name.toLowerCase(), e]));

// Look up a known exercise by name (case-insensitive). Returns null for custom exercises.
export function findExercise(name) {
  return byLowerName.get(String(name).trim().toLowerCase()) || null;
}

// Muscle groups for an exercise entry as stored in a workout. Custom exercises
// carry their own primary/secondary arrays chosen by the user.
export function musclesFor(exercise) {
  if (exercise.cardio) return { primary: [], secondary: [] };
  const known = findExercise(exercise.name);
  if (known) return { primary: known.primary, secondary: known.secondary };
  return {
    primary: exercise.primary || [],
    secondary: exercise.secondary || [],
  };
}

// Prefix-and-substring autocomplete over strength + cardio entries.
export function searchExercises(query, limit = 8) {
  const q = String(query).trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const e of [...EXERCISES, ...CARDIO]) {
    const n = e.name.toLowerCase();
    if (n.startsWith(q)) starts.push(e);
    else if (n.includes(q)) contains.push(e);
  }
  return [...starts, ...contains].slice(0, limit);
}

// A few representative exercises per muscle group, for split templates.
export function examplesFor(group, limit = 4) {
  return EXERCISES.filter(e => e.primary[0] === group).slice(0, limit).map(e => e.name);
}
