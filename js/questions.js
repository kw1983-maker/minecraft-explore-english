// Question bank built from the Super Minds 1 student's book (Units 5–7).
// Organized as UNITS — the player picks one on the start screen. Each unit
// has 3 stages mapped to game levels: level 1 = vocabulary, level 2 = grammar,
// level 3+ = mixed challenge (science/geography pages, phonics, story phrases).
// Each question: { visual?: emoji/picture, category, q: question text,
//   options: [...], answer: index of correct option, hint?, explain? }
// All multiple-choice so they grade automatically (no typing barrier).
// To add a new unit later: append one object to UNITS and run build.py —
// the start screen builds its unit buttons from this array automatically.

export const UNITS = [
  // ============ Unit 5: Free time ============
  {
    id: 'unit5',
    name: 'Unit 5 — Free time',
    emoji: '⚽',
    blurb: 'Days of the week & activities',
    stages: [
      {
        name: 'Free time words',
        questions: [
          { visual: '📅', category: 'Days of the week', q: 'How many days are there in a week?', options: ['Five', 'Six', 'Seven', 'Eight'], answer: 2, hint: 'Count from Monday to Sunday.', explain: 'A week has seven days: Monday to Sunday.' },
          { visual: '📅', category: 'Days of the week', q: 'Which day comes after Monday?', options: ['Tuesday', 'Thursday', 'Friday', 'Sunday'], answer: 0, hint: 'Monday, ___, Wednesday…', explain: 'The order is Monday, Tuesday, Wednesday.' },
          { visual: '📅', category: 'Days of the week', q: 'Which day comes after Friday?', options: ['Monday', 'Saturday', 'Wednesday', 'Tuesday'], answer: 1, hint: 'It is a weekend day.', explain: 'After Friday comes Saturday.' },
          { visual: '📅', category: 'Days of the week', q: 'Which day comes before Thursday?', options: ['Friday', 'Saturday', 'Wednesday', 'Sunday'], answer: 2, hint: 'Tuesday, ___, Thursday…', explain: 'Wednesday comes before Thursday.' },
          { visual: '🗓️', category: 'Days of the week', q: 'Which two days are the weekend?', options: ['Monday and Tuesday', 'Wednesday and Thursday', 'Saturday and Sunday', 'Friday and Monday'], answer: 2, hint: 'No school on these days!', explain: 'The weekend is Saturday and Sunday — more time to play!' },
          { visual: '⚽', category: 'Free time', q: 'What activity is this?', options: ['Play football', 'Go swimming', 'Watch TV', 'Ride my bike'], answer: 0, hint: 'You kick a ball.', explain: 'You play football with a ball.' },
          { visual: '🏊', category: 'Free time', q: 'What activity is this?', options: ['Play computer games', 'Go swimming', 'Play football', 'Read books'], answer: 1, hint: 'You do it in the water.', explain: 'You go swimming in the water.' },
          { visual: '📺', category: 'Free time', q: 'What activity is this?', options: ['Ride my bike', 'Play football', 'Watch TV', 'Go swimming'], answer: 2, hint: 'You sit and look at a screen.', explain: 'You watch TV on a screen.' },
          { visual: '🎮', category: 'Free time', q: 'What activity is this?', options: ['Play computer games', 'Watch TV', 'Read books', 'Sing'], answer: 0, hint: 'You use a controller.', explain: 'You play computer games with a controller.' },
          { visual: '🚲', category: 'Free time', q: 'What activity is this?', options: ['Go swimming', 'Ride my bike', 'Play football', 'Play with toys'], answer: 1, hint: 'It has two wheels.', explain: 'You ride your bike — it has two wheels.' },
          { visual: '📖', category: 'Free time', q: 'What activity is this?', options: ['Watch TV', 'Play computer games', 'Read books', 'Sing'], answer: 2, hint: 'It has pages and words.', explain: 'You read books.' },
        ],
      },
      {
        name: 'Free time grammar',
        questions: [
          { category: 'Grammar', q: 'I go swimming ___ Mondays.', options: ['in', 'on', 'at', 'to'], answer: 1, hint: 'Use this word with days.', explain: 'Use "on" with days: I go swimming on Mondays.' },
          { category: 'Grammar', q: 'I ___ football on Saturdays.', options: ['play', 'plays', 'playing', 'to play'], answer: 0, hint: 'With "I" the verb is simple.', explain: 'With "I" we say: I play football.' },
          { category: 'Grammar', q: 'Do you watch TV at the weekend? — Yes, I ___.', options: ['am', 'do', 'is', 'watch TV'], answer: 1, hint: 'The question starts with "Do".', explain: 'Answer "Do you…?" with: Yes, I do.' },
          { category: 'Grammar', q: 'Do you play computer games at the weekend? — No, I ___.', options: ['not', 'am not', "don't", "doesn't"], answer: 2, hint: 'Short answer for "no".', explain: 'Answer "Do you…?" with: No, I don\'t.' },
          { category: 'Grammar', q: '___ you watch TV at the weekend?', options: ['Is', 'Are', 'Do', 'Does'], answer: 2, hint: 'The answer is "Yes, I do."', explain: 'Questions like this start with "Do": Do you watch TV?' },
          { category: 'Grammar', q: 'On Fridays we ___ football.', options: ['go', 'play', 'do', 'watch'], answer: 1, hint: 'Football is a game.', explain: 'We say "play football".' },
          { category: 'Grammar', q: 'On Mondays we ___ swimming.', options: ['play', 'do', 'go', 'make'], answer: 2, hint: 'We ___ swimming, like the busy week song.', explain: 'We say "go swimming".' },
          { category: 'Grammar', q: 'We play computer games ___ Wednesdays and Thursdays.', options: ['at', 'in', 'on', 'of'], answer: 2, hint: 'Same word as "___ Mondays".', explain: 'Use "on" with days: on Wednesdays.' },
          { visual: '🚲', category: 'Grammar', q: 'On Tuesdays I ride my ___.', options: ['bike', 'book', 'TV', 'ball'], answer: 0, hint: 'It has two wheels.', explain: 'You ride your bike.' },
          { category: 'Grammar', q: 'On Saturdays and Sundays I ___ TV and sleep.', options: ['read', 'watch', 'go', 'ride'], answer: 1, hint: 'From the poem "My perfect week".', explain: 'We say "watch TV".' },
        ],
      },
      {
        name: 'Free time quest',
        questions: [
          { visual: '🥦', category: 'Healthy life', q: 'For a healthy life, it is important to eat ___ food.', options: ['healthy', 'fast', 'cold', 'sweet'], answer: 0, hint: 'Fruit and vegetables are…', explain: 'It is important to eat healthy food.' },
          { visual: '💪', category: 'Healthy life', q: 'How do you keep fit?', options: ['I do sport.', 'I sleep all day.', 'I watch TV all day.', 'I eat ice cream.'], answer: 0, hint: 'Run, swim, play football…', explain: 'Doing sport keeps you fit.' },
          { visual: '😴', category: 'Healthy life', q: 'Which one is healthy?', options: ['Sleeping well', 'Eating sweets all day', 'Watching TV all night', 'Never playing'], answer: 0, hint: 'You do it in bed at night.', explain: 'Sleep is important for a healthy life.' },
          { visual: '🧩', category: 'Healthy life', q: 'For a healthy life, it is important to learn ___ things.', options: ['new', 'old', 'no', 'slow'], answer: 0, hint: 'Things you don\'t know yet.', explain: 'It is important to learn new things.' },
          { category: 'Story', q: 'The children can\'t find the lake. They say: "We\'re ___!"', options: ['lost', 'happy', 'hungry', 'late'], answer: 0, hint: 'They don\'t know where they are.', explain: 'When you don\'t know the way, you say "We\'re lost!"' },
          { visual: '🐰', category: 'Story', q: 'The rabbit helps the children. It says: "Come ___ me."', options: ['at', 'with', 'on', 'for'], answer: 1, hint: 'Follow me!', explain: 'The rabbit says "Come with me."' },
          { category: 'Story', q: 'You give something to a friend. You say: "___ you are."', options: ['Here', 'There', 'Where', 'How'], answer: 0, hint: 'The children say it to the rabbit.', explain: 'When you give something, you say "Here you are."' },
          { visual: '🦆', category: 'Phonics', q: 'Mum jumps in the m___d with the ducks.', options: ['u', 'a', 'e', 'o'], answer: 0, hint: 'The same sound as "mum" and "duck".', explain: 'Mum jumps in the mud with the ducks — the "u" sound.' },
          { visual: '🦆', category: 'Phonics', q: 'Which word has the same sound as "mud"?', options: ['jump', 'park', 'week', 'TV'], answer: 0, hint: 'Listen: mum, duck, j___p.', explain: 'Mud and jump both have the "u" sound.' },
          { visual: '🏞️', category: 'This week', q: 'On Sunday there is a trip to the ___.', options: ['lake', 'school', 'shop', 'moon'], answer: 0, hint: 'A big place with water.', explain: 'On the class notice board: Sunday — trip to the lake.' },
          { visual: '⚽', category: 'This week', q: 'On Saturday there is a football ___.', options: ['match', 'bed', 'book', 'cake'], answer: 0, hint: 'Two teams play it.', explain: 'On Saturday there is a football match.' },
        ],
      },
    ],
  },

  // ============ Unit 6: The old house ============
  {
    id: 'unit6',
    name: 'Unit 6 — The old house',
    emoji: '🏚️',
    blurb: 'Rooms, There is / There are & habitats',
    stages: [
      {
        name: 'House words',
        questions: [
          { visual: '🛁', category: 'The home', q: 'You wash in this room. What is it?', options: ['Bathroom', 'Kitchen', 'Bedroom', 'Hall'], answer: 0, hint: 'It has a bath.', explain: 'You wash in the bathroom.' },
          { visual: '🛏️', category: 'The home', q: 'You sleep in this room. What is it?', options: ['Living room', 'Bedroom', 'Cellar', 'Dining room'], answer: 1, hint: 'It has a bed.', explain: 'You sleep in the bedroom.' },
          { visual: '🍳', category: 'The home', q: 'You cook in this room. What is it?', options: ['Bathroom', 'Hall', 'Kitchen', 'Bedroom'], answer: 2, hint: 'Dinner is made here.', explain: 'You cook in the kitchen.' },
          { visual: '🍽️', category: 'The home', q: 'You eat dinner at a big table in this room.', options: ['Dining room', 'Bathroom', 'Cellar', 'Stairs'], answer: 0, hint: 'Dining means eating.', explain: 'You eat in the dining room.' },
          { visual: '🛋️', category: 'The home', q: 'You sit on the sofa in this room.', options: ['Kitchen', 'Living room', 'Bathroom', 'Cellar'], answer: 1, hint: 'The family relaxes here.', explain: 'The sofa is in the living room.' },
          { visual: '🪜', category: 'The home', q: 'You walk up and down these.', options: ['Doors', 'Windows', 'Stairs', 'Walls'], answer: 2, hint: 'They go from floor to floor.', explain: 'You walk up and down the stairs.' },
          { visual: '🕯️', category: 'The home', q: 'This dark room is under the house.', options: ['Cellar', 'Bedroom', 'Hall', 'Living room'], answer: 0, hint: 'Go down the stairs…', explain: 'The cellar is under the house.' },
          { visual: '🚪', category: 'The home', q: 'You come in the front door and stand here.', options: ['Bathroom', 'Cellar', 'Dining room', 'Hall'], answer: 3, hint: 'It is between the front door and the rooms.', explain: 'The hall is just inside the front door.' },
          { visual: '🏚️', category: 'The home', q: 'The children in the story visit the old ___.', options: ['school', 'house', 'shop', 'park'], answer: 1, hint: 'The name of this unit!', explain: 'They visit the old house.' },
          { category: 'The home', q: 'Which one is NOT a room in a house?', options: ['Kitchen', 'Bedroom', 'Park', 'Bathroom'], answer: 2, hint: 'You play outside in it.', explain: 'A park is outside — it is not a room.' },
        ],
      },
      {
        name: 'There is / There are',
        questions: [
          { visual: '👾', category: 'Grammar', q: 'There ___ a monster.', options: ['is', 'are', 'am', 'be'], answer: 0, hint: 'One monster.', explain: 'For one thing: There is (There\'s) a monster.' },
          { visual: '🐱', category: 'Grammar', q: 'There ___ four cats.', options: ['is', 'are', 'am', 'be'], answer: 1, hint: 'More than one cat.', explain: 'For many things: There are four cats.' },
          { visual: '🏠', category: 'Grammar', q: 'There ___ three bedrooms.', options: ['is', 'are', 'am', 'do'], answer: 1, hint: 'Three is more than one.', explain: 'There are three bedrooms.' },
          { category: 'Grammar', q: 'Is there a park? — Yes, there ___.', options: ['is', 'are', "isn't", 'do'], answer: 0, hint: 'A short "yes" answer.', explain: 'Is there…? — Yes, there is.' },
          { category: 'Grammar', q: 'Are there any rats? — No, there ___.', options: ["isn't", "aren't", 'not', "don't"], answer: 1, hint: 'A short "no" answer for many things.', explain: 'Are there any…? — No, there aren\'t.' },
          { visual: '🚗', category: 'Grammar', q: 'How many cars ___ there?', options: ['is', 'am', 'are', 'be'], answer: 2, hint: 'Cars — more than one.', explain: 'How many cars are there? There are four cars.' },
          { visual: '✈️', category: 'Grammar', q: '___ there a plane?', options: ['Is', 'Are', 'Do', 'Am'], answer: 0, hint: 'One plane.', explain: 'For one thing ask: Is there a plane?' },
          { visual: '🚲', category: 'Grammar', q: '___ there any bikes?', options: ['Is', 'Are', 'Does', 'Am'], answer: 1, hint: 'Bikes — more than one.', explain: 'For many things ask: Are there any bikes?' },
          { visual: '🕷️', category: 'Grammar', q: 'In the song: "There\'s a spider ___ the kitchen."', options: ['in', 'under', 'at', 'of'], answer: 0, hint: 'Inside the room.', explain: 'There\'s a spider in the kitchen.' },
          { visual: '🐊', category: 'Grammar', q: 'In the song: "There are seven ___ in my lovely bathroom."', options: ['crocodiles', 'tigers', 'cats', 'snakes'], answer: 0, hint: 'Big green animals with sharp teeth!', explain: 'There are seven crocodiles in my lovely bathroom.' },
          { visual: '🐯', category: 'Grammar', q: 'There ___ lots of tigers in my lovely garden.', options: ['is', 'are', 'am', "isn't"], answer: 1, hint: 'Lots of tigers — more than one.', explain: 'There are tigers, lots of tigers!' },
        ],
      },
      {
        name: 'Habitats quest',
        questions: [
          { visual: '🐯', category: 'Habitats', q: 'Where do you find tigers?', options: ['In the jungle', 'In the desert', 'In the polar region', 'In the ocean'], answer: 0, hint: 'A green place with lots of trees.', explain: 'You find tigers in the jungle.' },
          { visual: '🐪', category: 'Habitats', q: 'Where do you find camels?', options: ['In the ocean', 'In the desert', 'In the jungle', 'In the polar region'], answer: 1, hint: 'A hot place with sand.', explain: 'You find camels in the desert.' },
          { visual: '🐻‍❄️', category: 'Habitats', q: 'Where do you find polar bears?', options: ['In the jungle', 'In the desert', 'In the polar region', 'In the mountains'], answer: 2, hint: 'A cold place with snow and ice.', explain: 'You find polar bears in the polar region.' },
          { visual: '🦈', category: 'Habitats', q: 'Where do you find sharks?', options: ['In the mountains', 'In the desert', 'In the jungle', 'In the ocean'], answer: 3, hint: 'They swim!', explain: 'You find sharks in the ocean.' },
          { visual: '🪸', category: 'Habitats', q: 'Where do you find coral?', options: ['In the ocean', 'In the mountains', 'In the jungle', 'In the desert'], answer: 0, hint: 'Under the water.', explain: 'You find coral in the ocean.' },
          { visual: '🐐', category: 'Habitats', q: 'Where do you find goats?', options: ['In the ocean', 'In the mountains', 'In the polar region', 'In the desert'], answer: 1, hint: 'High rocky places.', explain: 'You find goats in the mountains.' },
          { visual: '🦜', category: 'Habitats', q: 'Where do you find parrots?', options: ['In the jungle', 'In the polar region', 'In the desert', 'In the ocean'], answer: 0, hint: 'A green place with lots of trees.', explain: 'You find parrots in the jungle.' },
          { visual: '🏜️', category: 'Habitats', q: 'You find sand in the ___.', options: ['desert', 'polar region', 'jungle', 'living room'], answer: 0, hint: 'A hot, dry place.', explain: 'You find sand in the desert.' },
          { visual: '❄️', category: 'Habitats', q: 'The polar regions are ___.', options: ['hot and red', 'white and blue', 'green and yellow', 'dark and warm'], answer: 1, hint: 'Think of snow and ice.', explain: 'The polar regions are white and blue.' },
          { visual: '🎩', category: 'Phonics', q: 'Harry\'s ___ is full of hats.', options: ['hall', 'ball', 'wall', 'doll'], answer: 0, hint: 'The room inside the front door — it starts with "h".', explain: 'Harry\'s hall is full of hats — the "h" sound.' },
          { visual: '🎩', category: 'Phonics', q: 'Which word starts with the same sound as "hat"?', options: ['help', 'shoe', 'cat', 'ball'], answer: 0, hint: 'H-h-h…', explain: 'Hat and help both start with the "h" sound.' },
        ],
      },
    ],
  },

  // ============ Unit 7: Get dressed! ============
  {
    id: 'unit7',
    name: 'Unit 7 — Get dressed!',
    emoji: '👕',
    blurb: 'Clothes, wearing & materials',
    stages: [
      {
        name: 'Clothes words',
        questions: [
          { visual: '👕', category: 'Clothes', q: 'What is this?', options: ['T-shirt', 'Sweater', 'Jacket', 'Skirt'], answer: 0, hint: 'You wear it when it is warm.', explain: 'This is a T-shirt.' },
          { visual: '👖', category: 'Clothes', q: 'What are these?', options: ['Socks', 'Jeans', 'Shorts', 'Shoes'], answer: 1, hint: 'Blue trousers.', explain: 'These are jeans — blue trousers.' },
          { visual: '🧦', category: 'Clothes', q: 'What are these?', options: ['Shoes', 'Caps', 'Socks', 'Trousers'], answer: 2, hint: 'You put them on your feet first.', explain: 'These are socks.' },
          { visual: '👟', category: 'Clothes', q: 'What are these?', options: ['Shoes', 'Socks', 'Skirts', 'Sweaters'], answer: 0, hint: 'You wear them over your socks.', explain: 'These are shoes.' },
          { visual: '🧢', category: 'Clothes', q: 'What is this?', options: ['Skirt', 'Cap', 'Sock', 'Jacket'], answer: 1, hint: 'You wear it on your head.', explain: 'This is a cap.' },
          { visual: '🧥', category: 'Clothes', q: 'What is this?', options: ['T-shirt', 'Skirt', 'Jacket', 'Shorts'], answer: 2, hint: 'You wear it outside over your clothes.', explain: 'This is a jacket.' },
          { visual: '🩳', category: 'Clothes', q: 'What are these?', options: ['Shorts', 'Trousers', 'Jeans', 'Socks'], answer: 0, hint: 'Short trousers for hot days.', explain: 'These are shorts.' },
          { category: 'Clothes', q: 'A girl can wear this instead of trousers.', options: ['Skirt', 'Cap', 'Sock', 'Sweater'], answer: 0, hint: 'Mum is wearing one in the picture.', explain: 'A skirt.' },
          { category: 'Clothes', q: 'You wear this warm top when it is cold.', options: ['Sweater', 'T-shirt', 'Shorts', 'Cap'], answer: 0, hint: 'It is made of wool.', explain: 'A sweater keeps you warm.' },
          { visual: '🎵', category: 'Clothes', q: 'In the chant: "Put on your T-shirt, put on your ___."', options: ['trousers', 'table', 'tiger', 'train'], answer: 0, hint: 'You wear them on your legs.', explain: 'Put on your T-shirt, put on your trousers!' },
        ],
      },
      {
        name: 'Clothes grammar',
        questions: [
          { visual: '🎩', category: 'Grammar', q: 'Do you like ___ hat?', options: ['this', 'these', 'they', 'them'], answer: 0, hint: 'One hat.', explain: 'For one thing: this hat.' },
          { visual: '👟', category: 'Grammar', q: 'Do you like ___ shoes?', options: ['this', 'these', 'it', 'him'], answer: 1, hint: 'Two shoes.', explain: 'For more than one thing: these shoes.' },
          { category: 'Grammar', q: 'Do you like this T-shirt? — Yes, I ___.', options: ['do', 'am', 'is', 'like'], answer: 0, hint: 'A short "yes" answer.', explain: 'Do you like…? — Yes, I do.' },
          { category: 'Grammar', q: 'Do you like these shoes? — No, I ___.', options: ['not', "don't", "doesn't", 'no'], answer: 1, hint: 'A short "no" answer.', explain: 'Do you like…? — No, I don\'t.' },
          { category: 'Grammar', q: 'Olivia ___ wearing a red sweater.', options: ['is', 'are', 'am', 'do'], answer: 0, hint: 'With "she/he" use…', explain: 'Olivia is wearing (Olivia\'s wearing) a red sweater.' },
          { category: 'Grammar', q: 'Is he wearing a blue T-shirt? — Yes, he ___.', options: ['does', 'is', 'do', 'are'], answer: 1, hint: 'The question starts with "Is".', explain: 'Is he wearing…? — Yes, he is.' },
          { category: 'Grammar', q: 'Is she wearing brown shoes? — No, she ___.', options: ["don't", 'not', "isn't", "aren't"], answer: 2, hint: 'A short "no" answer with "is".', explain: 'Is she wearing…? — No, she isn\'t.' },
          { category: 'Grammar', q: '___ he wearing a blue T-shirt?', options: ['Is', 'Are', 'Do', 'Am'], answer: 0, hint: 'He = one boy.', explain: 'Ask: Is he wearing a blue T-shirt?' },
          { visual: '🚴', category: 'Grammar', q: 'Tom is ___ a blue helmet. He is riding a bike.', options: ['wearing', 'wear', 'wears', 'eating'], answer: 0, hint: 'is + …ing', explain: 'He is wearing a blue helmet.' },
          { visual: '🧦', category: 'Grammar', q: 'These socks ___ red.', options: ['is', 'are', 'am', 'be'], answer: 1, hint: 'Socks — more than one.', explain: 'These socks are red.' },
        ],
      },
      {
        name: 'Materials quest',
        questions: [
          { visual: '🌱', category: 'Materials', q: 'Cotton comes from ___.', options: ['plants', 'cows', 'sheep', 'rocks'], answer: 0, hint: 'It grows in fields.', explain: 'Cotton comes from plants.' },
          { visual: '🐄', category: 'Materials', q: 'Leather comes from ___.', options: ['sheep', 'cows', 'plants', 'fish'], answer: 1, hint: 'A big farm animal that says "moo".', explain: 'Leather comes from cows.' },
          { visual: '🐑', category: 'Materials', q: 'Wool comes from ___.', options: ['plants', 'cows', 'sheep', 'trees'], answer: 2, hint: 'A fluffy white farm animal.', explain: 'Wool comes from sheep.' },
          { visual: '🧶', category: 'Materials', q: 'Wool is ___.', options: ['warm', 'cold', 'wet', 'loud'], answer: 0, hint: 'Good for winter sweaters.', explain: 'Wool is warm.' },
          { visual: '👞', category: 'Materials', q: 'Leather is ___.', options: ['cool', 'warm', 'strong', 'soft'], answer: 2, hint: 'Good for shoes and belts.', explain: 'Leather is strong.' },
          { visual: '👕', category: 'Materials', q: 'Cotton is ___.', options: ['cool', 'warm', 'heavy', 'hard'], answer: 0, hint: 'Good for hot days.', explain: 'Cotton is cool.' },
          { category: 'Materials', q: 'You can wear leather ___ and jackets.', options: ['shoes', 'socks', 'T-shirts', 'sweaters'], answer: 0, hint: 'You wear them on your feet.', explain: 'You can wear leather shoes and jackets.' },
          { visual: '🧢', category: 'Story', q: 'You take a friend\'s cap by mistake. You say: "I\'m very ___."', options: ['sorry', 'happy', 'cool', 'tall'], answer: 0, hint: 'The boy says it to Gary.', explain: 'When you make a mistake, say "I\'m very sorry."' },
          { category: 'Story', q: 'Your friend says sorry. You say: "It\'s ___."', options: ['OK', 'no', 'bad', 'old'], answer: 0, hint: 'Gary is kind about it.', explain: 'Gary answers: "It\'s OK."' },
          { visual: '🕷️', category: 'Phonics', q: 'Six ___ stop for sandwiches on the stairs.', options: ['spiders', 'dogs', 'cats', 'bears'], answer: 0, hint: 'Small animals with eight legs — "s" sound!', explain: 'Six spiders stop for sandwiches on the stairs — the "s" sound.' },
          { visual: '🥪', category: 'Phonics', q: 'Which word starts with the same sound as "six"?', options: ['sandwich', 'hat', 'cap', 'jeans'], answer: 0, hint: 'S-s-s…', explain: 'Six and sandwich both start with the "s" sound.' },
        ],
      },
    ],
  },
];

// Pick `count` unique random questions from the unit's stage for this level
// (level 1 = first stage, later levels clamp to the last stage).
export function pickQuestions(unit, level, count) {
  const stage = unit.stages[Math.min(level - 1, unit.stages.length - 1)];
  const pool = [...stage.questions];
  // Fisher–Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    stageName: stage.name,
    questions: pool.slice(0, Math.min(count, pool.length)),
  };
}
