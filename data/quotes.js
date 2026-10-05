// Real quotes shown in the Penalty Zone. Heartwarming, not harsh.
// Swap any of these freely: each one is just { text, author }.

export const QUOTES = [
  {
    text: "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
    author: 'Mary Anne Radmacher',
  },
  { text: 'How we spend our days is, of course, how we spend our lives.', author: 'Annie Dillard' },
  { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
  {
    text: 'The impediment to action advances action. What stands in the way becomes the way.',
    author: 'Marcus Aurelius',
  },
  { text: 'The best way out is always through.', author: 'Robert Frost' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'You may encounter many defeats, but you must not be defeated.', author: 'Maya Angelou' },
  {
    text: 'Although the world is full of suffering, it is full also of the overcoming of it.',
    author: 'Helen Keller',
  },
  {
    text: "I've failed over and over and over again in my life. And that is why I succeed.",
    author: 'Michael Jordan',
  },
  { text: 'Arise, awake, and stop not till the goal is reached.', author: 'Swami Vivekananda' },
  { text: 'If you want to shine like a sun, first burn like a sun.', author: 'A. P. J. Abdul Kalam' },
  {
    text: 'Our greatest glory is not in never falling, but in rising every time we fall.',
    author: 'Oliver Goldsmith',
  },
  {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
  },
  { text: 'Even the darkest night will end and the sun will rise.', author: 'Victor Hugo' },
  {
    text: 'A man who dares to waste one hour of time has not discovered the value of life.',
    author: 'Charles Darwin',
  },
  { text: 'Nothing great was ever achieved without enthusiasm.', author: 'Ralph Waldo Emerson' },
  { text: "Don't stop when you're tired. Stop when you're done.", author: 'David Goggins' },
  {
    text: "Don't quit. Suffer now and live the rest of your life as a champion.",
    author: 'Muhammad Ali',
  },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  {
    text: 'Perseverance is not a long race; it is many short races one after the other.',
    author: 'Walter Elliot',
  },
];

// The quote shown on Today. The same date always gives the same quote, so it
// stays put all day and changes overnight.
export function quoteOfTheDay(date) {
  const sum = [...date].reduce((total, char) => total + char.charCodeAt(0), 0);
  return QUOTES[sum % QUOTES.length];
}
