
const TOTAL_STEPS = 4;
const REVIEW_STEP = 4;
const MIN_AGE = 16;
const MAX_AGE = 60;
const MOTIVATION_MIN_CHARS = 30;
const MOTIVATION_MIN_WORDS = 5;
const PASSWORD_MIN = 8;
const TAKEN_EMAILS = ['test@example.com', 'aigerim@mail.kz', 'admin@astanait.edu.kz'];
const TAKEN_USERNAMES = ['admin', 'student', 'aigerim', 'teacher'];

const PROGRAMS = {
  web: { label: 'Web Development', levels: ['beginner', 'intermediate', 'advanced'] },
  data: { label: 'Data Science', levels: ['beginner', 'intermediate', 'advanced'] },
  cyber: { label: 'Cybersecurity', levels: ['intermediate', 'advanced'] },
  mobile: { label: 'Mobile Apps', levels: ['beginner', 'intermediate', 'advanced'] }
};

const STEP_FIELDS = {
  1: ['fullName', 'email', 'phone', 'birthDate'],
  2: ['program', 'level', 'intake', 'motivation'],
  3: ['username', 'password', 'confirmPassword', 'terms']
};

const LABELS = {
  fullName: 'Full name', email: 'Email', phone: 'Phone', birthDate: 'Date of birth',
  program: 'Program', level: 'Level', intake: 'Start date', motivation: 'Motivation',
  username: 'Username', password: 'Password', confirmPassword: 'Repeat password', terms: 'Confirmation'
};

const STEP_TITLES = { 1: 'Personal data', 2: 'Program', 3: 'Account' };

const DEPENDENTS = {
  program: ['level'],
  level: ['program'],
  fullName: ['password'],
  email: ['password'],
  username: ['password'],
  password: ['confirmPassword']
};

const form = document.getElementById('application-form');
form.noValidate = true;
const wizardEl = document.getElementById('wizard');
const resultEl = document.getElementById('result');
const errorSummary = document.getElementById('error-summary');
const stepPanels = form.querySelectorAll('.step');
const stepperItems = document.querySelectorAll('#stepper li');
const progressEl = document.getElementById('progress');
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');
const reviewEl = document.getElementById('review');
const summaryEl = document.getElementById('summary');
const filledCountEl = document.getElementById('filled-count');
const motivationCount = document.getElementById('motivation-count');

let currentStep = 1;
const touched = new Set();
const issuedNumbers = [];

function getValue(name) {
  const input = form.elements[name];
  if (input.type === 'checkbox') {
    return input.checked;
  }
  return name === 'password' || name === 'confirmPassword' ? input.value : input.value.trim();
}

function getData() {
  const data = {};
  for (const step of [1, 2, 3]) {
    for (const name of STEP_FIELDS[step]) {
      data[name] = getValue(name);
    }
  }
  return data;
}

function calcAge(iso) {
  const born = new Date(iso);
  if (Number.isNaN(born.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return age;
}

function firstNameOf(fullName) {
  return fullName.split(/\s+/)[0].toLowerCase();
}

const rules = {
  fullName: function (value) {
    const words = value.split(/\s+/).filter(function (w) { return w !== ''; });
    if (words.length < 2 || words.length > 4) {
      return 'Enter your first and last name (2 to 4 words).';
    }
    const ok = words.every(function (w) { return /^\p{L}[\p{L}'’-]+$/u.test(w); });
    return ok ? '' : 'Use only letters, hyphens and apostrophes in each word.';
  },

  email: function (value) {
    const domain = value.split('@')[1] || '';
    if (!domain.includes('.')) {
      return 'The email domain must contain a dot, e.g. name@mail.com.';
    }
    if (TAKEN_EMAILS.includes(value.toLowerCase())) {
      return 'This email is already registered. Use another one.';
    }
    return '';
  },

  phone: function (value) {
    const digits = value.replace(/\D/g, '');
    return /^[78]\d{10}$/.test(digits) ? '' : 'Use a Kazakhstan number like +7 701 123 45 67 (11 digits).';
  },

  birthDate: function (value) {
    const age = calcAge(value);
    if (age === null) {
      return 'Enter a valid date.';
    }
    if (age < 0) {
      return 'The date of birth cannot be in the future.';
    }
    if (age < MIN_AGE) {
      return 'You must be at least ' + MIN_AGE + ' years old (you are ' + age + ').';
    }
    if (age > MAX_AGE) {
      return 'The maximum age is ' + MAX_AGE + '.';
    }
    return '';
  },

  level: function (value, data) {
    if (data.program !== '' && PROGRAMS[data.program] !== undefined && !PROGRAMS[data.program].levels.includes(value)) {
      return PROGRAMS[data.program].label + ' is not open to the "' + value + '" level.';
    }
    return '';
  },
  program: function (value, data) {
    if (value !== '' && data.level !== '' && !PROGRAMS[value].levels.includes(data.level)) {
      return PROGRAMS[value].label + ' is not open to the "' + data.level + '" level. Pick another program or level.';
    }
    return '';
  },

  motivation: function (value) {
    const words = value.split(/\s+/).filter(function (w) { return w !== ''; });
    if (value.length < MOTIVATION_MIN_CHARS) {
      return 'Write at least ' + MOTIVATION_MIN_CHARS + ' characters (now ' + value.length + ').';
    }
    if (words.length < MOTIVATION_MIN_WORDS) {
      return 'Write at least ' + MOTIVATION_MIN_WORDS + ' words.';
    }
    return '';
  },

  username: function (value) {
    if (!/^[A-Za-z][A-Za-z0-9_]{3,15}$/.test(value)) {
      return '4–16 characters, start with a letter, use only letters, digits and "_".';
    }
    if (TAKEN_USERNAMES.includes(value.toLowerCase())) {
      return 'This username is taken. Try another one.';
    }
    return '';
  },

  password: function (value, data) {
    if (value.length < PASSWORD_MIN) {
      return 'Use at least ' + PASSWORD_MIN + ' characters.';
    }
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
      return 'Add an upper-case letter, a lower-case letter and a digit.';
    }
    const lower = value.toLowerCase();
    const emailName = data.email.split('@')[0].toLowerCase();
    const firstName = firstNameOf(data.fullName);
    if (data.username.length >= 3 && lower.includes(data.username.toLowerCase())) {
      return 'The password must not contain your username.';
    }
    if (firstName.length >= 3 && lower.includes(firstName)) {
      return 'The password must not contain your first name (from step 1).';
    }
    if (emailName.length >= 3 && lower.includes(emailName)) {
      return 'The password must not contain the name part of your email (from step 1).';
    }
    return '';
  },

  confirmPassword: function (value, data) {
    return value === data.password ? '' : 'The passwords do not match.';
  }
};

function showError(name, message, isValidMark) {
  const input = form.elements[name];
  document.getElementById('err-' + name).textContent = message;
  input.setAttribute('aria-invalid', message !== '' ? 'true' : 'false');
  input.classList.toggle('is-invalid', message !== '');
  input.classList.toggle('is-valid', message === '' && isValidMark === true);
}

function validateField(name) {
  const input = form.elements[name];
  input.setCustomValidity('');
  let message = '';

  if (input.validity.valueMissing) {
    message = name === 'terms' ? 'You must confirm to continue.' : LABELS[name] + ' is required.';
  } else if (input.validity.typeMismatch) {
    message = 'Enter a valid email like name@example.com.';
  } else if (rules[name] !== undefined) {
    message = rules[name](getValue(name), getData());
  }

  input.setCustomValidity(message);
  showError(name, message, true);
  return message;
}

function validateStep(step) {
  const invalid = [];
  for (const name of STEP_FIELDS[step]) {
    touched.add(name);
    if (validateField(name) !== '') {
      invalid.push(name);
    }
  }
  return invalid;
}

function showErrorSummary(count) {
  errorSummary.hidden = false;
  errorSummary.textContent = count + (count === 1 ? ' error' : ' errors') + ' found. Please fix ' + (count === 1 ? 'it' : 'them') + ' to continue.';
}

function hideErrorSummary() {
  errorSummary.hidden = true;
  errorSummary.textContent = '';
}

function displayValue(name) {
  const input = form.elements[name];
  if (input.type === 'checkbox') {
    return input.checked ? 'Confirmed' : '';
  }
  if (name === 'password' || name === 'confirmPassword') {
    return input.value === '' ? '' : '•'.repeat(Math.min(input.value.length, 12));
  }
  if (input.tagName === 'SELECT') {
    return input.value === '' ? '' : input.selectedOptions[0].textContent;
  }
  return input.value.trim();
}

function addRow(list, label, value) {
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value === '' ? 'not filled yet' : value;
  dd.classList.toggle('is-empty', value === '');
  list.appendChild(dt);
  list.appendChild(dd);
}

function renderSummary() {
  summaryEl.replaceChildren();
  let filled = 0;
  let total = 0;
  for (const step of [1, 2, 3]) {
    for (const name of STEP_FIELDS[step]) {
      if (name === 'confirmPassword') {
        continue;
      }
      const value = displayValue(name);
      total += 1;
      if (value !== '') {
        filled += 1;
      }
      addRow(summaryEl, LABELS[name], value);
    }
  }
  filledCountEl.textContent = filled + ' of ' + total + ' fields filled.';
  motivationCount.textContent = form.elements.motivation.value.length + ' / 300';
}

function renderReview() {
  reviewEl.replaceChildren();
  for (const step of [1, 2, 3]) {
    const section = document.createElement('section');
    section.className = 'review-section';

    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = STEP_TITLES[step];
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn--small';
    edit.textContent = 'Edit';
    edit.dataset.goto = String(step);
    edit.setAttribute('aria-label', 'Edit ' + STEP_TITLES[step]);
    header.appendChild(title);
    header.appendChild(edit);
    section.appendChild(header);

    const list = document.createElement('dl');
    list.className = 'summary-dl';
    for (const name of STEP_FIELDS[step]) {
      if (name === 'confirmPassword') {
        continue;
      }
      addRow(list, LABELS[name], displayValue(name));
    }
    section.appendChild(list);
    reviewEl.appendChild(section);
  }
}

function renderStep() {
  for (const panel of stepPanels) {
    panel.hidden = Number(panel.dataset.step) !== currentStep;
  }
  stepperItems.forEach(function (item) {
    const n = Number(item.dataset.step);
    item.classList.toggle('is-current', n === currentStep);
    item.classList.toggle('is-done', n < currentStep);
    if (n === currentStep) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  });
  progressEl.value = currentStep;
  backBtn.disabled = currentStep === 1;
  nextBtn.textContent = currentStep === REVIEW_STEP ? 'Submit application' : 'Next';
  if (currentStep === REVIEW_STEP) {
    renderReview();
  }
}

function goToStep(step, focusTarget) {
  currentStep = step;
  renderStep();
  const panel = form.querySelector('.step[data-step="' + step + '"]');
  const target = focusTarget || panel.querySelector('.step-title');
  target.focus();
}

function handleNext() {
  const invalid = validateStep(currentStep);
  if (invalid.length > 0) {
    showErrorSummary(invalid.length);
    form.elements[invalid[0]].focus();
    return;
  }
  hideErrorSummary();
  goToStep(currentStep + 1);
}

function handleSubmit() {
  for (const step of [1, 2, 3]) {
    const invalid = validateStep(step);
    if (invalid.length > 0) {
      showErrorSummary(invalid.length);
      goToStep(step, form.elements[invalid[0]]);
      return;
    }
  }
  hideErrorSummary();
  showConfirmation(getData());
}

function makeApplicationNumber() {
  let number;
  do {
    number = 'APP-' + new Date().getFullYear() + '-' + (Math.floor(Math.random() * 90000) + 10000);
  } while (issuedNumbers.includes(number));
  issuedNumbers.push(number);
  return number;
}

function showConfirmation(data) {
  const number = makeApplicationNumber();

  resultEl.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = 'Application received!';
  title.tabIndex = -1;
  const thanks = document.createElement('p');
  thanks.textContent = 'Thank you, ' + data.fullName + '. Your application number is:';
  const code = document.createElement('p');
  code.className = 'code';
  code.textContent = number;
  const info = document.createElement('p');
  info.className = 'muted';
  info.textContent = PROGRAMS[data.program].label + ' (' + data.level + '). A confirmation was sent to ' + data.email + '.';
  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'btn btn--primary';
  again.id = 'new-application';
  again.textContent = 'Start a new application';
  resultEl.append(title, thanks, code, info, again);

  resetForm();
  wizardEl.parentElement.hidden = true;
  resultEl.hidden = false;
  title.focus();
}

function resetForm() {
  form.reset();
  touched.clear();
  for (const step of [1, 2, 3]) {
    for (const name of STEP_FIELDS[step]) {
      form.elements[name].setCustomValidity('');
      showError(name, '', false);
      form.elements[name].removeAttribute('aria-invalid');
    }
  }
  hideErrorSummary();
  currentStep = 1;
  renderStep();
  renderSummary();
}

form.addEventListener('focusout', function (event) {
  const name = event.target.name;
  if (!name || !STEP_FIELDS[1].concat(STEP_FIELDS[2], STEP_FIELDS[3]).includes(name)) {
    return;
  }
  touched.add(name);
  validateField(name);
});

form.addEventListener('input', function (event) {
  const name = event.target.name;
  if (!name) {
    return;
  }
  if (touched.has(name)) {
    validateField(name);
  }
  for (const other of DEPENDENTS[name] || []) {
    if (touched.has(other)) {
      validateField(other);
    }
  }
  renderSummary();
});

form.addEventListener('submit', function (event) {
  event.preventDefault();
  if (currentStep === REVIEW_STEP) {
    handleSubmit();
  } else {
    handleNext();
  }
});

backBtn.addEventListener('click', function () {
  if (currentStep > 1) {
    hideErrorSummary();
    goToStep(currentStep - 1);
  }
});

reviewEl.addEventListener('click', function (event) {
  const button = event.target.closest('button[data-goto]');
  if (button !== null) {
    hideErrorSummary();
    goToStep(Number(button.dataset.goto));
  }
});

resultEl.addEventListener('click', function (event) {
  if (event.target.id === 'new-application') {
    resultEl.hidden = true;
    wizardEl.parentElement.hidden = false;
    goToStep(1, form.elements.fullName);
  }
});

renderStep();
renderSummary();
