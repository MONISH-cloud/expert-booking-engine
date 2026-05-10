require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Expert   = require('./src/models/Expert');
const Booking  = require('./src/models/Booking');

const CATEGORIES = [
  'Technology', 'Healthcare', 'Finance', 'Legal',
  'Design', 'Marketing', 'Education', 'Business',
];

const TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00',
];

function generateSlots() {
  const slots = [];
  const today = new Date();
  // Generate slots for next 14 days
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Each expert gets 6-10 random slots per day
    const dayTimes = faker.helpers.arrayElements(TIMES, faker.number.int({ min: 6, max: 10 }));
    dayTimes.sort();

    for (const time of dayTimes) {
      slots.push({ date: dateStr, time, isBooked: false });
    }
  }
  return slots;
}

function generateExperts(count = 50) {
  const experts = [];
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName  = faker.person.lastName();
    const category  = faker.helpers.arrayElement(CATEGORIES);

    experts.push({
      name:       `${firstName} ${lastName}`,
      category,
      experience: faker.number.int({ min: 1, max: 25 }),
      rating:     Number((faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 })).toFixed(1)),
      bio:        faker.lorem.sentences({ min: 2, max: 4 }),
      avatar:     `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=random&size=200&bold=true`,
      hourlyRate: faker.number.int({ min: 50, max: 300 }),
      availableSlots: generateSlots(),
    });
  }
  return experts;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[SEED] Connected to MongoDB');

    await Expert.deleteMany({});
    await Booking.deleteMany({});
    console.log('[SEED] Cleared existing data');

    const experts = generateExperts(50);
    await Expert.insertMany(experts);
    console.log(`[SEED] Inserted ${experts.length} experts with slots`);

    await mongoose.disconnect();
    console.log('[SEED] Done!');
    process.exit(0);
  } catch (err) {
    console.error('[SEED] Error:', err.message);
    process.exit(1);
  }
}

seed();
