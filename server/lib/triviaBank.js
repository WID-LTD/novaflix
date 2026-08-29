// Static fallback bank for the Daily Trivia guarantee: every day must serve
// >= MIN_DAILY questions even when TMDB generation fails or runs short.
// Rows mirror the shape of generateDaily() entries (movie_id stays NULL so
// they never collide with ux_trivia_questions_date_movie).
//
// pickForDate(key, count) is deterministic: same UTC date => same subset,
// so every user sees the same daily set.

export const TRIVIA_BANK = [
  // ---- EASY ----
  { question: 'Who directed the 1994 film "Pulp Fiction"?', options: ['Quentin Tarantino', 'Steven Spielberg', 'Martin Scorsese', 'Ridley Scott'], answer_index: 0, answer_text: 'Quentin Tarantino', difficulty: 'easy' },
  { question: 'In "The Lion King" (1994), what is the name of Simba\'s father?', options: ['Mufasa', 'Scar', 'Rafiki', 'Zazu'], answer_index: 0, answer_text: 'Mufasa', difficulty: 'easy' },
  { question: 'Which movie features the line "May the Force be with you"?', options: ['Star Wars', 'Star Trek', 'Dune', 'Battlestar Galactica'], answer_index: 0, answer_text: 'Star Wars', difficulty: 'easy' },
  { question: 'What is the name of the wizard school in "Harry Potter"?', options: ['Hogwarts', 'Narnia', 'Middle-earth', 'Camp Half-Blood'], answer_index: 0, answer_text: 'Hogwarts', difficulty: 'easy' },
  { question: 'In "Finding Nemo", what kind of fish is Nemo?', options: ['Clownfish', 'Angelfish', 'Pufferfish', 'Betta'], answer_index: 0, answer_text: 'Clownfish', difficulty: 'easy' },
  { question: 'Which superhero is also known as Bruce Wayne?', options: ['Batman', 'Superman', 'Spider-Man', 'Iron Man'], answer_index: 0, answer_text: 'Batman', difficulty: 'easy' },
  { question: 'In "Frozen", who is Elsa\'s younger sister?', options: ['Anna', 'Ariel', 'Aurora', 'Jasmine'], answer_index: 0, answer_text: 'Anna', difficulty: 'easy' },
  { question: '"Titanic" (1997) stars Leonardo DiCaprio and which actress?', options: ['Kate Winslet', 'Cate Blanchett', 'Angelina Jolie', 'Emma Stone'], answer_index: 0, answer_text: 'Kate Winslet', difficulty: 'easy' },

  // ---- NORMAL ----
  { question: 'Which film won the first Academy Award for Best Picture?', options: ['Wings', 'Sunrise', 'The Jazz Singer', 'Metropolis'], answer_index: 0, answer_text: 'Wings', difficulty: 'normal' },
  { question: 'Who composed the score for "The Good, the Bad and the Ugly"?', options: ['Ennio Morricone', 'Nino Rota', 'Hans Zimmer', 'John Barry'], answer_index: 0, answer_text: 'Ennio Morricone', difficulty: 'normal' },
  { question: 'In "The Matrix", which pill does Neo take?', options: ['Red', 'Blue', 'Green', 'White'], answer_index: 0, answer_text: 'Red', difficulty: 'normal' },
  { question: 'Which director is known for the "Cornetto Trilogy"?', options: ['Edgar Wright', 'Simon Pegg', 'Joe Cornish', 'Ben Wheatley'], answer_index: 0, answer_text: 'Edgar Wright', difficulty: 'normal' },
  { question: 'What year does "Blade Runner" (1982) take place in?', options: ['2019', '2021', '2025', '2049'], answer_index: 0, answer_text: '2019', difficulty: 'normal' },
  { question: 'Which actor played Joker in "The Dark Knight" (2008)?', options: ['Heath Ledger', 'Jack Nicholson', 'Joaquin Phoenix', 'Jared Leto'], answer_index: 0, answer_text: 'Heath Ledger', difficulty: 'normal' },
  { question: 'In "Jurassic Park", what DNA is used to fill dinosaur gaps?', options: ['Frog DNA', 'Bird DNA', 'Snake DNA', 'Crocodile DNA'], answer_index: 0, answer_text: 'Frog DNA', difficulty: 'normal' },
  { question: 'Which studio produced "Spirited Away"?', options: ['Studio Ghibli', 'Toei Animation', 'Madhouse', 'Kyoto Animation'], answer_index: 0, answer_text: 'Studio Ghibli', difficulty: 'normal' },

  // ---- HARD ----
  { question: 'Who played the bass guitar theme for "Shaft" (1971)?', options: ['Isaac Hayes', 'James Brown', 'Marvin Gaye', 'Curtis Mayfield'], answer_index: 0, answer_text: 'Isaac Hayes', difficulty: 'hard' },
  { question: 'Which film was the first to use the Wilhelm scream?', options: ['Distant Drums (1951)', 'The Charge at Feather River', 'Them!', 'Forbidden Planet'], answer_index: 0, answer_text: 'Distant Drums (1951)', difficulty: 'hard' },
  { question: '"Citizen Kane" was nominated for how many Academy Awards?', options: ['9', '5', '12', '14'], answer_index: 0, answer_text: '9', difficulty: 'hard' },
  { question: 'Who was the cinematographer of "Apocalypse Now" (1979)?', options: ['Vittorio Storaro', 'Gordon Willis', 'Conrad Hall', 'Roger Deakins'], answer_index: 0, answer_text: 'Vittorio Storaro', difficulty: 'hard' },
  { question: 'Which Kubrick film was shot almost entirely by candlelight?', options: ['Barry Lyndon', 'Clockwork Orange', 'The Shining', 'Paths of Glory'], answer_index: 0, answer_text: 'Barry Lyndon', difficulty: 'hard' },
  { question: 'What was Pixar\'s first short film to win an Oscar?', options: ['Tin Toy', 'Luxo Jr.', 'Gerri\'s Game', 'Boundin\''], answer_index: 0, answer_text: 'Tin Toy', difficulty: 'hard' },
  { question: 'In "Casablanca" (1942), what does Rick own?', options: ['A café', 'A hotel', 'A casino boat', 'A barbershop'], answer_index: 0, answer_text: 'A café', difficulty: 'hard' },

  // ---- VERY HARD ----
  { question: 'Which film held the record for most Oscars won (11) alongside Titanic and Ben-Hur?', options: ['The Return of the King', 'La La Land', 'Gone with the Wind', 'Chicago'], answer_index: 0, answer_text: 'The Return of the King', difficulty: 'very_hard' },
  { question: 'Who edited "Raging Bull" (1980)?', options: ['Thelma Schoonmaker', 'Sally Menke', 'Michael Kahn', 'Walter Murch'], answer_index: 0, answer_text: 'Thelma Schoonmaker', difficulty: 'very_hard' },
  { question: 'Which silent film\'s flop bankrupted United Artists in 1980?', options: ['Heaven\'s Gate', 'New York, New York', 'One from the Heart', 'Ishtar'], answer_index: 0, answer_text: 'Heaven\'s Gate', difficulty: 'very_hard' },
  { question: 'The match cut in "2001: A Space Odyssey" transitions from a bone to what?', options: ['An orbital weapon platform', 'A spacecraft model', 'Monolith replica', 'A satellite dish'], answer_index: 0, answer_text: 'An orbital weapon platform', difficulty: 'very_hard' },
  { question: 'Which actress won back-to-back Best Actress Oscars in 1937 and 1938?', options: ['Luise Rainer', 'Bette Davis', 'Katharine Hepburn', 'Vivien Leigh'], answer_index: 0, answer_text: 'Luise Rainer', difficulty: 'very_hard' },
  { question: '"Persona" (1966) was directed by which Swedish filmmaker?', options: ['Ingmar Bergman', 'Victor Sjöström', 'Roy Andersson', 'Jan Troell'], answer_index: 0, answer_text: 'Ingmar Bergman', difficulty: 'very_hard' },
  { question: 'What was the first film shot entirely in digital cinema 4K?', options: ['Sky Captain and the World of Tomorrow', 'Star Wars: Episode II', 'Collateral', 'Sin City'], answer_index: 0, answer_text: 'Sky Captain and the World of Tomorrow', difficulty: 'very_hard' },
]

const TIERS = ['easy', 'normal', 'hard', 'very_hard']

/** Deterministic PRNG from date key so all users share one daily subset. */
function seededRandom(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

function seededShuffle(arr, rand) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick `count` bank questions deterministically for a date key,
 * balanced round-robin across difficulties, then shuffled.
 * Options are re-shuffled per pick (seeded) so the correct answer
 * does not always sit at index 0.
 */
export function pickFromBank(key, count) {
  if (!count || count <= 0) return []
  const rand = seededRandom(`trivia-bank:${key}`)
  const groups = {}
  for (const tier of TIERS) {
    groups[tier] = seededShuffle(
      TRIVIA_BANK.filter((q) => q.difficulty === tier),
      rand
    )
  }
  const picked = []
  let exhausted = false
  while (picked.length < count && !exhausted) {
    exhausted = true
    for (const tier of TIERS) {
      const next = groups[tier].shift()
      if (next) {
        const correctText = next.options[next.answer_index]
        const opts = seededShuffle(next.options, rand)
        picked.push({
          ...next,
          options: opts,
          answer_index: opts.indexOf(correctText),
        })
        exhausted = false
        if (picked.length >= count) break
      }
    }
  }
  return picked
}
