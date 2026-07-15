import { context, requestExpandedMode } from '@devvit/web/client';

const startButton = document.getElementById('start-button') as HTMLButtonElement;
const greeting = document.getElementById('greeting') as HTMLParagraphElement;

startButton.addEventListener('click', (e) => {
  requestExpandedMode(e, 'game');
});

greeting.textContent = `Welcome, Detective ${context.username ?? 'Rookie'} 🕵️`;
