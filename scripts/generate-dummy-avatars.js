// Script to generate dummy avatars for all users using Dicebear
// Best Practice: Deterministic avatars, easy to extend for future custom uploads

const fs = require('fs');
const path = require('path');
const Avatars = require('@dicebear/avatars').default;
const IdenticonSprites = require('@dicebear/avatars-identicon-sprites').default;

// Example user list (replace with real user IDs/usernames as needed)
const users = [
  { id: '1', username: 'alice' },
  { id: '2', username: 'bob' },
  { id: '3', username: 'carol' },
  { id: '4', username: 'dave' },
  { id: '5', username: 'eve' },
];

const avatars = new Avatars(IdenticonSprites, {});

const outputDir = path.join(__dirname, '../public/avatars');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

users.forEach(user => {
  const svg = avatars.create(user.username);
  const filePath = path.join(outputDir, `${user.username}.svg`);
  fs.writeFileSync(filePath, svg, 'utf8');
  console.log(`Generated avatar for ${user.username}: ${filePath}`);
});

console.log('Dummy avatars generated!');
