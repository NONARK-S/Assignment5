const MAX_HP = 100;
const HERO_MIN_DMG = 8;
const HERO_MAX_DMG = 15;
const HEAL_AMOUNT = 20;
const MAX_HEALS = 3;
const ENEMY_MIN_DMG = 5;
const ENEMY_MAX_DMG = 14;
const CRIT_CHANCE = 0.1;
const CRIT_MULTIPLIER = 2;
const DEFEND_DIVISOR = 2;
const LOG_SIZE = 5;
const LOW_HP_PERCENT = 30;
const VALID_ACTIONS = ['attack', 'defend', 'heal'];

const messageEl = document.getElementById('message');
const resultEl = document.getElementById('result');
const heroCard = document.getElementById('hero-card');
const enemyCard = document.getElementById('enemy-card');
const heroBar = document.getElementById('hero-hp');
const enemyBar = document.getElementById('enemy-hp');
const heroHpText = document.getElementById('hero-hp-text');
const enemyHpText = document.getElementById('enemy-hp-text');
const healsLeftEl = document.getElementById('heals-left');
const heroStatusEl = document.getElementById('hero-status');
const enemyInfoEl = document.getElementById('enemy-info');
const stateRound = document.getElementById('state-round');
const stateHero = document.getElementById('state-hero');
const stateEnemy = document.getElementById('state-enemy');
const stateHeals = document.getElementById('state-heals');
const stateShield = document.getElementById('state-shield');
const logEl = document.getElementById('log');
const logEmptyEl = document.getElementById('log-empty');
const actionsEl = document.getElementById('actions');
const actionButtons = actionsEl.querySelectorAll('button[data-action]');
const restartBtn = document.getElementById('restart');

let state;

function newState() {
  return {
    heroHp: MAX_HP,
    enemyHp: MAX_HP,
    healsLeft: MAX_HEALS,
    defending: false,
    over: false,
    round: 1,
    log: []
  };
}


function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDamage(min, max) {
  const base = randInt(min, max);
  const crit = Math.random() < CRIT_CHANCE;
  return { damage: crit ? base * CRIT_MULTIPLIER : base, crit: crit };
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message' + (type ? ' message--' + type : '');
}

function addLog(text, crit) {
  state.log.unshift({ text: text, crit: crit === true });
  if (state.log.length > LOG_SIZE) {
    state.log.length = LOG_SIZE;
  }
}


function validateMove(action) {
  if (!VALID_ACTIONS.includes(action)) {
    return 'Unknown move. Choose attack, defend or heal.';
  }
  if (state.over) {
    return 'The battle is over. Press Restart to play again.';
  }
  if (action === 'heal' && state.healsLeft === 0) {
    return 'No heals left. Attack or defend instead.';
  }
  if (action === 'heal' && state.heroHp === MAX_HP) {
    return 'You are already at full HP. Healing is not needed.';
  }
  if (action === 'defend' && state.defending) {
    return 'You are already defending. Choose another move.';
  }
  return '';
}

function heroTurn(action) {
  const error = validateMove(action);
  if (error !== '') {
    setMessage(error, 'error');
    return;
  }

  let text = '';

  if (action === 'attack') {
    const hit = rollDamage(HERO_MIN_DMG, HERO_MAX_DMG);
    state.enemyHp = Math.max(0, state.enemyHp - hit.damage);
    text = 'Hero attacks for ' + hit.damage + ' damage' + (hit.crit ? ' (CRITICAL!)' : '') + '.';
    addLog(text, hit.crit);
  } else if (action === 'defend') {
    state.defending = true;
    text = 'Hero raises a shield: the next hit is halved.';
    addLog(text);
  } else {
    const before = state.heroHp;
    state.heroHp = Math.min(MAX_HP, state.heroHp + HEAL_AMOUNT);
    state.healsLeft = state.healsLeft - 1;
    text = 'Hero heals ' + (state.heroHp - before) + ' HP.';
    addLog(text);
  }

  if (state.enemyHp === 0) {
    finishGame(true);
    render();
    return;
  }

  const enemyText = enemyTurn();

  if (state.heroHp === 0) {
    finishGame(false);
  } else {
    setMessage(text + ' ' + enemyText, 'info');
    state.round = state.round + 1;
  }
  render();
}

function enemyTurn() {
  const hit = rollDamage(ENEMY_MIN_DMG, ENEMY_MAX_DMG);
  let damage = hit.damage;
  let shielded = false;

  if (state.defending === true) {
    damage = Math.floor(damage / DEFEND_DIVISOR);
    shielded = true;
    state.defending = false;
  }

  state.heroHp = Math.max(0, state.heroHp - damage);

  const text = 'Enemy hits for ' + damage + ' damage'
    + (shielded ? ' (halved by shield)' : '')
    + (hit.crit ? ' (CRITICAL!)' : '') + '.';
  addLog(text, hit.crit);
  return text;
}

function finishGame(heroWon) {
  state.over = true;
  if (heroWon) {
    addLog('Enemy is defeated. Victory!');
    setMessage('You hit the final blow. You win!', 'ok');
  } else {
    addLog('Hero has fallen. Defeat.');
    setMessage('The enemy was too strong. You lose.', 'error');
  }
}

function restart() {
  state = newState();
  setMessage('New battle started. Choose your move.', 'info');
  render();
}

function percent(hp) {
  return (hp / MAX_HP) * 100;
}

function render() {
  heroBar.max = MAX_HP;
  enemyBar.max = MAX_HP;
  heroBar.value = state.heroHp;
  enemyBar.value = state.enemyHp;
  heroBar.classList.toggle('hp--low', percent(state.heroHp) <= LOW_HP_PERCENT);
  enemyBar.classList.toggle('hp--low', percent(state.enemyHp) <= LOW_HP_PERCENT);

  heroHpText.textContent = state.heroHp + ' / ' + MAX_HP;
  enemyHpText.textContent = state.enemyHp + ' / ' + MAX_HP;
  healsLeftEl.textContent = state.healsLeft + ' / ' + MAX_HEALS;
  enemyInfoEl.textContent = 'Hits for ' + ENEMY_MIN_DMG + '–' + ENEMY_MAX_DMG + ' damage.';

  heroStatusEl.textContent = state.defending ? 'Defending' : 'Ready';
  heroStatusEl.classList.toggle('badge--ok', state.defending);
  heroCard.classList.toggle('is-defending', state.defending);
  heroCard.classList.toggle('is-defeated', state.over && state.heroHp === 0);
  enemyCard.classList.toggle('is-defeated', state.over && state.enemyHp === 0);

  stateRound.textContent = String(state.round);
  stateHero.textContent = state.heroHp + ' HP';
  stateEnemy.textContent = state.enemyHp + ' HP';
  stateHeals.textContent = String(state.healsLeft);
  stateShield.textContent = state.defending ? 'Active' : 'None';

  resultEl.hidden = !state.over;
  resultEl.classList.toggle('result--win', state.over && state.enemyHp === 0);
  resultEl.classList.toggle('result--lose', state.over && state.heroHp === 0);
  if (state.over) {
    resultEl.textContent = state.enemyHp === 0 ? 'VICTORY' : 'DEFEAT';
  }

  for (const btn of actionButtons) {
    btn.disabled = state.over;
  }

  logEl.replaceChildren();
  for (const entry of state.log) {
    const li = document.createElement('li');
    li.textContent = entry.text;
    li.classList.toggle('is-crit', entry.crit);
    logEl.appendChild(li);
  }
  logEmptyEl.hidden = state.log.length > 0;
}

actionsEl.addEventListener('click', function (event) {
  const button = event.target.closest('button[data-action]');
  if (button === null) {
    return;
  }
  heroTurn(button.dataset.action);
});

restartBtn.addEventListener('click', restart);

restart();