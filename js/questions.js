// Question bank for ESL beginners — vocabulary + grammar.
// Organized into 3 tiers (mapped to levels). Each question:
//   { visual?: emoji/picture, category, q: question text, options: [...],
//     answer: index of correct option, hint?, explain? }
// All multiple-choice so they grade automatically (no typing barrier).
// Easy to extend: just add objects to any tier array.

export const TIERS = [
  // ---------- Tier 1: Vocabulary basics ----------
  {
    name: 'Vocabulary',
    questions: [
      { visual: '🐶', category: 'Animals', q: 'What is this animal?', options: ['Cat', 'Dog', 'Cow', 'Fish'], answer: 1, hint: 'It says "woof!"', explain: 'A dog is a friendly pet that barks.' },
      { visual: '🍎', category: 'Food', q: 'What is this fruit?', options: ['Banana', 'Grape', 'Apple', 'Orange'], answer: 2, hint: 'It is red and round.', explain: 'An apple is a red or green fruit.' },
      { visual: '🐱', category: 'Animals', q: 'What is this animal?', options: ['Cat', 'Lion', 'Mouse', 'Bird'], answer: 0, hint: 'It says "meow!"', explain: 'A cat is a small pet that says meow.' },
      { visual: '🔴', category: 'Colors', q: 'What color is this?', options: ['Blue', 'Green', 'Red', 'Yellow'], answer: 2, hint: 'The color of strawberries.', explain: 'This color is red.' },
      { visual: '☀️', category: 'Nature', q: 'What is this?', options: ['Moon', 'Sun', 'Star', 'Cloud'], answer: 1, hint: 'It shines in the day.', explain: 'The sun gives us light during the day.' },
      { visual: '🏠', category: 'Objects', q: 'What is this?', options: ['House', 'Car', 'Tree', 'Boat'], answer: 0, hint: 'People live in it.', explain: 'A house is where people live.' },
      { visual: '🐟', category: 'Animals', q: 'What is this animal?', options: ['Bird', 'Frog', 'Fish', 'Snake'], answer: 2, hint: 'It swims in water.', explain: 'A fish lives and swims in water.' },
      { visual: '🍌', category: 'Food', q: 'What is this fruit?', options: ['Banana', 'Lemon', 'Pear', 'Mango'], answer: 0, hint: 'It is long and yellow.', explain: 'A banana is a long yellow fruit.' },
      { visual: '🌳', category: 'Nature', q: 'What is this?', options: ['Flower', 'Tree', 'Grass', 'Bush'], answer: 1, hint: 'It is tall with leaves.', explain: 'A tree is a tall plant with a trunk and leaves.' },
      { visual: '3️⃣', category: 'Numbers', q: 'What number is this?', options: ['Two', 'Five', 'Three', 'Eight'], answer: 2, hint: 'Comes after two.', explain: 'This is the number three (3).' },
      { visual: '🐮', category: 'Animals', q: 'What is this animal?', options: ['Pig', 'Cow', 'Goat', 'Horse'], answer: 1, hint: 'It gives us milk.', explain: 'A cow gives us milk and says "moo".' },
      { visual: '🔵', category: 'Colors', q: 'What color is this?', options: ['Blue', 'Pink', 'Brown', 'Gray'], answer: 0, hint: 'The color of the sky.', explain: 'This color is blue.' },
      { visual: '🚗', category: 'Objects', q: 'What is this?', options: ['Bus', 'Bike', 'Car', 'Train'], answer: 2, hint: 'It has four wheels and a driver.', explain: 'A car is a vehicle people drive.' },
      { visual: '⭐', category: 'Nature', q: 'What is this?', options: ['Sun', 'Star', 'Moon', 'Rain'], answer: 1, hint: 'You see many at night.', explain: 'A star shines in the night sky.' },
      { visual: '🍞', category: 'Food', q: 'What is this?', options: ['Cake', 'Bread', 'Rice', 'Egg'], answer: 1, hint: 'You make sandwiches with it.', explain: 'Bread is a common food made from flour.' },
    ],
  },

  // ---------- Tier 2: Vocabulary + simple grammar ----------
  {
    name: 'Words & Grammar',
    questions: [
      { category: 'Grammar', q: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], answer: 0, hint: 'Use with "I".', explain: 'With "I" we use "am": I am a student.' },
      { category: 'Grammar', q: 'She ___ happy.', options: ['am', 'are', 'is', 'be'], answer: 2, hint: 'Use with "she/he/it".', explain: 'With "she" we use "is": She is happy.' },
      { category: 'Plurals', q: 'One cat, two ___.', options: ['cat', 'cats', 'cates', 'caties'], answer: 1, hint: 'Add -s for more than one.', explain: 'Most plurals just add -s: cats.' },
      { category: 'Grammar', q: 'They ___ my friends.', options: ['is', 'am', 'are', 'be'], answer: 2, hint: 'Use with "they/we/you".', explain: 'With "they" we use "are": They are my friends.' },
      { category: 'Vocabulary', q: 'The opposite of "big" is ___.', options: ['tall', 'small', 'long', 'wide'], answer: 1, hint: 'Something tiny.', explain: 'The opposite of big is small.' },
      { category: 'Plurals', q: 'One box, two ___.', options: ['boxs', 'boxes', 'box', 'boxies'], answer: 1, hint: 'Words ending in -x add -es.', explain: 'Box becomes boxes (add -es).' },
      { category: 'Vocabulary', q: 'The opposite of "hot" is ___.', options: ['warm', 'cold', 'wet', 'soft'], answer: 1, hint: 'Like ice.', explain: 'The opposite of hot is cold.' },
      { category: 'Grammar', q: 'I have ___ apple.', options: ['a', 'an', 'the', 'some'], answer: 1, hint: 'Apple starts with a vowel sound.', explain: 'Use "an" before vowel sounds: an apple.' },
      { category: 'Grammar', q: 'He ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1, hint: 'With "he", add -s.', explain: 'With he/she/it, add -s: He goes to school.' },
      { category: 'Vocabulary', q: 'Which one is a color?', options: ['Chair', 'Green', 'Run', 'Loud'], answer: 1, hint: 'Look for the color word.', explain: 'Green is a color.' },
      { category: 'Plurals', q: 'One baby, two ___.', options: ['babys', 'babyes', 'babies', 'baby'], answer: 2, hint: 'Change -y to -ies.', explain: 'Baby becomes babies (y → ies).' },
      { category: 'Grammar', q: 'We ___ playing football.', options: ['is', 'am', 'are', 'be'], answer: 2, hint: 'Use with "we".', explain: 'With "we" we use "are": We are playing.' },
      { category: 'Vocabulary', q: 'The opposite of "happy" is ___.', options: ['sad', 'glad', 'fast', 'old'], answer: 0, hint: 'A bad feeling.', explain: 'The opposite of happy is sad.' },
      { category: 'Grammar', q: 'I have ___ dog.', options: ['an', 'a', 'the', 'two'], answer: 1, hint: 'Dog starts with a consonant sound.', explain: 'Use "a" before consonant sounds: a dog.' },
      { category: 'Vocabulary', q: 'Which one is an animal?', options: ['Table', 'Rabbit', 'Window', 'Spoon'], answer: 1, hint: 'It hops and has long ears.', explain: 'A rabbit is an animal.' },
    ],
  },

  // ---------- Tier 3: Grammar sentences ----------
  {
    name: 'Grammar Quest',
    questions: [
      { category: 'Verb Tense', q: 'Yesterday I ___ to the park.', options: ['go', 'goes', 'went', 'going'], answer: 2, hint: 'Past tense of "go".', explain: '"Went" is the past tense of "go".' },
      { category: 'Prepositions', q: 'The cat is ___ the table.', options: ['on', 'in', 'at', 'of'], answer: 0, hint: 'Sitting on the surface.', explain: 'Use "on" for a surface: on the table.' },
      { category: 'Articles', q: 'Can you pass me ___ salt, please?', options: ['a', 'an', 'the', '—'], answer: 2, hint: 'There is only one specific salt.', explain: 'Use "the" for a specific thing both people know.' },
      { category: 'Verb Tense', q: 'She ___ a book right now.', options: ['read', 'reads', 'is reading', 'readed'], answer: 2, hint: '"Right now" = happening now.', explain: 'Present continuous for now: is reading.' },
      { category: 'Prepositions', q: 'I was born ___ 2010.', options: ['on', 'at', 'in', 'by'], answer: 2, hint: 'Use with years.', explain: 'Use "in" with years: in 2010.' },
      { category: 'Word Order', q: 'Choose the correct sentence.', options: ['She a teacher is.', 'Is she a teacher.', 'She is a teacher.', 'A teacher she is.'], answer: 2, hint: 'Subject + verb + rest.', explain: 'English order: subject (She) + verb (is) + rest.' },
      { category: 'Verb Tense', q: 'They ___ football last week.', options: ['play', 'played', 'plays', 'playing'], answer: 1, hint: '"Last week" = past.', explain: 'Past tense: played football last week.' },
      { category: 'Prepositions', q: 'The keys are ___ my bag.', options: ['on', 'in', 'at', 'over'], answer: 1, hint: 'Inside the bag.', explain: 'Use "in" for inside something: in my bag.' },
      { category: 'Articles', q: 'I saw ___ elephant at the zoo.', options: ['a', 'an', 'the', 'some'], answer: 1, hint: 'Elephant starts with a vowel sound.', explain: 'Use "an" before vowel sounds: an elephant.' },
      { category: 'Verb Tense', q: 'Look! It ___ outside.', options: ['rain', 'rains', 'is raining', 'rained'], answer: 2, hint: 'Happening right now.', explain: 'Present continuous: it is raining now.' },
      { category: 'Word Order', q: 'Choose the correct question.', options: ['You like do pizza?', 'Do you like pizza?', 'Like you pizza do?', 'Pizza you do like?'], answer: 1, hint: 'Questions often start with "Do".', explain: 'Question form: Do + you + like + pizza?' },
      { category: 'Prepositions', q: 'We meet ___ Monday.', options: ['in', 'at', 'on', 'by'], answer: 2, hint: 'Use with days of the week.', explain: 'Use "on" with days: on Monday.' },
      { category: 'Verb Tense', q: 'I ___ my homework already.', options: ['finish', 'finished', 'have finished', 'finishing'], answer: 2, hint: '"Already" often uses present perfect.', explain: 'Present perfect with "already": have finished.' },
      { category: 'Articles', q: '___ sun is very bright today.', options: ['A', 'An', 'The', 'Some'], answer: 2, hint: 'There is only one sun.', explain: 'Use "the" for unique things: The sun.' },
      { category: 'Word Order', q: 'Choose the correct sentence.', options: ['I every morning run.', 'Run I every morning.', 'I run every morning.', 'Every I run morning.'], answer: 2, hint: 'Subject + verb + time.', explain: 'Correct: I (subject) run (verb) every morning (time).' },
    ],
  },
];

// Pick `count` unique random questions from a tier (clamped to tier size).
export function pickQuestions(tierIndex, count) {
  const tier = TIERS[Math.min(tierIndex, TIERS.length - 1)];
  const pool = [...tier.questions];
  // Fisher–Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    tierName: tier.name,
    questions: pool.slice(0, Math.min(count, pool.length)),
  };
}
