const STORAGE_KEY = 'pulsechat-state-v1';
const socket = window.io ? window.io() : null;

const defaultUsers = [
  { name: 'Ava', email: 'ava@gmail.com', password: '123456', phone: '+2348030000001', status: 'Available now', online: true, profileReady: true },
  { name: 'Leo', email: 'leo@gmail.com', password: '123456', phone: '+2348090000002', status: 'In a meeting', online: false, profileReady: true },
  { name: 'Maya', email: 'maya@gmail.com', password: '123456', phone: '+2347010000003', status: 'Working from home', online: true, profileReady: true }
];

const defaultState = {
  users: defaultUsers,
  currentUser: null,
  chats: [
    { id: 'community-group', type: 'group', title: 'Community Group', roomId: 'community-group', unread: 0, messages: [] }
  ],
  activeChatId: 'community-group',
  darkMode: true,
  typing: {},
  notifications: [],
  replyTarget: null,
  mobileChatOpen: false
};

const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
const state = savedState || JSON.parse(JSON.stringify(defaultState));

const elements = {
  homeScreen: document.getElementById('homeScreen'),
  homeGetStartedBtn: document.getElementById('homeGetStartedBtn'),
  heroGetStartedBtn: document.getElementById('heroGetStartedBtn'),
  homeSignInBtn: document.getElementById('homeSignInBtn'),
  heroSignInBtn: document.getElementById('heroSignInBtn'),
  authHomeBtn: document.getElementById('authHomeBtn'),
  welcomeScreen: document.getElementById('welcomeScreen'),
  welcomeForm: document.getElementById('welcomeForm'),
  welcomeNameInput: document.getElementById('welcomeNameInput'),
  welcomeAvatarInput: document.getElementById('welcomeAvatarInput'),
  welcomeAvatarPreview: document.getElementById('welcomeAvatarPreview'),
  welcomeError: document.getElementById('welcomeError'),
  authScreen: document.getElementById('authScreen'),
  appShell: document.getElementById('appShell'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  registerName: document.getElementById('registerName'),
  registerEmail: document.getElementById('registerEmail'),
  registerPhone: document.getElementById('registerPhone'),
  registerPassword: document.getElementById('registerPassword'),
  demoLoginBtn: document.getElementById('demoLoginBtn'),
  authTabs: document.querySelectorAll('.auth-tab'),
  gmailSearchInput: document.getElementById('gmailSearchInput'),
  gmailSearchBtn: document.getElementById('gmailSearchBtn'),
  gmailSearchResult: document.getElementById('gmailSearchResult'),
  phoneSearchInput: document.getElementById('phoneSearchInput'),
  phoneSearchBtn: document.getElementById('phoneSearchBtn'),
  phoneSearchResult: document.getElementById('phoneSearchResult'),
  profileName: document.getElementById('profileName'),
  profileStatus: document.getElementById('profileStatus'),
  profileAvatar: document.getElementById('profileAvatar'),
  infoName: document.getElementById('infoName'),
  infoEmail: document.getElementById('infoEmail'),
  infoAvatar: document.getElementById('infoAvatar'),
  statusPreview: document.getElementById('statusPreview'),
  chatCount: document.getElementById('chatCount'),
  chatList: document.getElementById('chatList'),
  chatTitle: document.getElementById('chatTitle'),
  chatPresence: document.getElementById('chatPresence'),
  headerAvatar: document.getElementById('headerAvatar'),
  messages: document.getElementById('messages'),
  typingIndicator: document.getElementById('typingIndicator'),
  replyBox: document.getElementById('replyBox'),
  messageForm: document.getElementById('messageForm'),
  messageInput: document.getElementById('messageInput'),
  emojiBtn: document.getElementById('emojiBtn'),
  attachBtn: document.getElementById('attachBtn'),
  fileInput: document.getElementById('fileInput'),
  voiceBtn: document.getElementById('voiceBtn'),
  clearReplyBtn: document.getElementById('clearReplyBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  mobileBackBtn: document.getElementById('mobileBackBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  archiveBtn: document.getElementById('archiveBtn'),
  setStatusBtn: document.getElementById('setStatusBtn'),
  editProfileBtn: document.getElementById('editProfileBtn'),
  contactSearch: document.getElementById('contactSearch'),
  onlineList: document.getElementById('onlineList'),
  currentUserName: document.getElementById('profileName')
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureBlankGroup() {
  if (!state.chats || !state.chats.length) {
    state.chats = [{ id: 'community-group', type: 'group', title: 'Community Group', roomId: 'community-group', unread: 0, messages: [] }];
  }

  if (!state.chats.some((chat) => chat.id === 'community-group')) {
    state.chats.unshift({ id: 'community-group', type: 'group', title: 'Community Group', roomId: 'community-group', unread: 0, messages: [] });
  }

  state.activeChatId = state.activeChatId || 'community-group';
}

function initials(name) {
  const parts = String(name || 'U').split(' ').filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhoneNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;
  return `+${digits}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getChatPreview(chat) {
  if (!chat || !chat.messages || !chat.messages.length) return 'No messages yet';
  const last = chat.messages[chat.messages.length - 1];
  return last.text || 'Shared item';
}

function loadUsers() {
  const saved = JSON.parse(localStorage.getItem('pulsechat-users') || 'null');
  if (Array.isArray(saved) && saved.length) return saved;
  localStorage.setItem('pulsechat-users', JSON.stringify(defaultUsers));
  return defaultUsers;
}

function persistUsers() {
  localStorage.setItem('pulsechat-users', JSON.stringify(state.users));
}

function setAuthMode(mode) {
  elements.authTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.authMode === mode));
  elements.loginForm.classList.toggle('active', mode === 'login');
  elements.registerForm.classList.toggle('active', mode === 'register');
}

function navigateTo(route) {
  const hash = route === 'home' ? '#home' : `#${route}`;
  if (window.location.hash === hash) {
    renderAuth();
    return;
  }
  window.location.hash = hash;
}

function sanitizeDisplayName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 25);
}

function renderAuth() {
  const hasUser = !!state.currentUser;
  const needsWelcome = hasUser && state.currentUser.profileReady !== true;
  const route = window.location.hash.slice(1);
  const showAuth = !hasUser && (route === 'login' || route === 'register');
  const showHome = !hasUser ? !showAuth : route === '' || route === 'home';

  elements.homeScreen.classList.toggle('hidden', !showHome || showAuth);
  elements.authScreen.classList.toggle('hidden', !showAuth);
  elements.appShell.classList.toggle('hidden', !hasUser || needsWelcome || showHome);
  elements.welcomeScreen.classList.toggle('hidden', !needsWelcome || showHome);

  if (showAuth) setAuthMode(route);

  if (needsWelcome) {
    const currentName = sanitizeDisplayName(state.currentUser.name || '');
    elements.welcomeNameInput.value = currentName;
    if (state.currentUser.avatarData) {
      elements.welcomeAvatarPreview.src = state.currentUser.avatarData;
      elements.welcomeAvatarPreview.classList.add('has-image');
    } else {
      elements.welcomeAvatarPreview.removeAttribute('src');
      elements.welcomeAvatarPreview.classList.remove('has-image');
    }
  }
}

function renderTheme() {
  const isDark = state.darkMode !== false;
  document.body.classList.toggle('dark', isDark);
  elements.themeToggleBtn.textContent = isDark ? 'Light mode' : 'Dark mode';
  localStorage.setItem('pulsechat-theme', isDark ? 'dark' : 'light');
}

function renderProfile() {
  const user = state.currentUser;
  if (!user) return;
  elements.profileName.textContent = user.name;
  elements.profileStatus.textContent = user.status || 'Available now';
  elements.profileAvatar.textContent = initials(user.name);
  elements.infoName.textContent = user.name;
  elements.infoEmail.textContent = user.email;
  elements.infoAvatar.textContent = initials(user.name);
  elements.statusPreview.textContent = user.status || 'Available now';

  if (user.avatarData) {
    elements.profileAvatar.style.backgroundImage = `url(${user.avatarData})`;
    elements.profileAvatar.style.backgroundSize = 'cover';
    elements.profileAvatar.style.backgroundPosition = 'center';
    elements.profileAvatar.textContent = '';

    elements.infoAvatar.style.backgroundImage = `url(${user.avatarData})`;
    elements.infoAvatar.style.backgroundSize = 'cover';
    elements.infoAvatar.style.backgroundPosition = 'center';
    elements.infoAvatar.textContent = '';
  } else {
    elements.profileAvatar.style.backgroundImage = '';
    elements.profileAvatar.textContent = initials(user.name);
    elements.infoAvatar.style.backgroundImage = '';
    elements.infoAvatar.textContent = initials(user.name);
  }
}

function renderSidebar() {
  const search = (document.getElementById('contactSearch') || {}).value || '';
  const filtered = state.chats.filter((chat) => {
    const value = `${chat.title} ${chat.messages.map((message) => message.text || '').join(' ')}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  elements.chatCount.textContent = String(filtered.length);
  elements.chatList.innerHTML = '';

  filtered.forEach((chat) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chat-item ${chat.id === state.activeChatId ? 'active' : ''}`;
    button.innerHTML = `
      <div class="chat-item-main">
        <div class="avatar">${initials(chat.title)}</div>
        <div class="chat-item-meta">
          <div class="chat-item-name">${escapeHtml(chat.title)}</div>
          <div class="chat-item-preview">${escapeHtml(getChatPreview(chat))}</div>
        </div>
      </div>
      <div class="chat-item-side">
        <span class="chat-item-time">${chat.messages.length ? formatTime(chat.messages[chat.messages.length - 1].time) : 'now'}</span>
        ${chat.unread ? `<span class="unread-pill">${chat.unread}</span>` : ''}
      </div>
    `;

    button.addEventListener('click', () => {
      state.activeChatId = chat.id;
      chat.unread = 0;
      state.mobileChatOpen = isMobileLayout();
      if (socket) socket.emit('join-room', { room: chat.roomId, userName: state.currentUser.name });
      render();
    });

    elements.chatList.appendChild(button);
  });
}

function renderMessages() {
  const chat = state.chats.find((entry) => entry.id === state.activeChatId) || state.chats[0];
  if (!chat) return;

  elements.chatTitle.textContent = chat.title;
  elements.chatPresence.textContent = chat.type === 'group' ? 'group chat' : 'online';
  elements.headerAvatar.textContent = initials(chat.title);
  elements.messages.innerHTML = '';

  if (!chat.messages.length) {
    const empty = document.createElement('div');
    empty.className = 'message-card';
    empty.innerHTML = '<div class="message-head"><strong>Start the conversation</strong></div><p class="message-text">No messages yet. Say hello.</p>';
    elements.messages.appendChild(empty);
    return;
  }

  chat.messages.forEach((message) => {
    const row = document.createElement('div');
    row.className = `message-row ${message.sender === state.currentUser.name ? 'me' : 'other'}`;

    const card = document.createElement('div');
    card.className = 'message-card';
    card.innerHTML = `
      <div class="message-head">
        <strong>${escapeHtml(message.sender)}</strong>
        <span>${formatTime(message.time)}</span>
      </div>
      <p class="message-text">${escapeHtml(message.text || 'Message')}</p>
    `;

    card.addEventListener('click', () => {
      state.replyTarget = { chatId: chat.id, messageId: message.id, sender: message.sender, text: message.text };
      renderReplyBox();
    });

    row.appendChild(card);
    elements.messages.appendChild(row);
  });

  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function renderReplyBox() {
  const reply = state.replyTarget;
  if (!reply) {
    elements.replyBox.classList.add('hidden');
    elements.replyBox.textContent = '';
    return;
  }

  elements.replyBox.classList.remove('hidden');
  elements.replyBox.textContent = `Replying to ${reply.sender}: ${reply.text}`;
}

function renderTyping() {
  const chat = state.chats.find((entry) => entry.id === state.activeChatId);
  if (!chat) return;
  const current = state.typing[chat.roomId];
  if (!current) {
    elements.typingIndicator.classList.add('hidden');
    elements.typingIndicator.textContent = '';
    return;
  }
  elements.typingIndicator.textContent = `${current} is typing...`;
  elements.typingIndicator.classList.remove('hidden');
}

function renderOnlineList() {
  const list = state.users.filter((user) => user.email !== state.currentUser.email);
  elements.onlineList.innerHTML = '';
  list.forEach((user) => {
    const row = document.createElement('div');
    row.className = 'online-row';
    row.innerHTML = `
      <span><span class="online-dot"></span>${escapeHtml(user.name)}</span>
      <small>${user.online ? 'online' : 'offline'}</small>
    `;
    elements.onlineList.appendChild(row);
  });
}

function isMobileLayout() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function syncMobileLayout() {
  const sidebar = document.querySelector('.sidebar');
  const chatPanel = document.querySelector('.chat-panel');
  if (!sidebar || !chatPanel) return;

  if (!isMobileLayout()) {
    sidebar.classList.remove('mobile-hidden');
    chatPanel.classList.remove('mobile-hidden');
    elements.mobileBackBtn?.classList.add('hidden');
    return;
  }

  const showChat = state.mobileChatOpen;
  sidebar.classList.toggle('mobile-hidden', showChat);
  chatPanel.classList.toggle('mobile-hidden', !showChat);
  elements.mobileBackBtn?.classList.toggle('hidden', !showChat);
}

function getUserByEmail(email) {
  const lookup = normalizeEmail(email);
  return state.users.find((user) => normalizeEmail(user.email) === lookup) || null;
}

function getUserByPhone(phone) {
  const lookup = normalizePhoneNumber(phone);
  return state.users.find((user) => normalizePhoneNumber(user.phone || '') === lookup) || null;
}

function renderUserResult(container, user, label) {
  if (!container) return;

  if (!user) {
    container.innerHTML = `
      <div class="user-not-found">
        <strong>User not found. This person must create an account before you can chat.</strong>
      </div>
    `;
    return;
  }

  const card = document.createElement('div');
  card.className = 'person-result';
  card.innerHTML = `
    <div class="avatar">${initials(user.name)}</div>
    <div class="details">
      <strong>${escapeHtml(user.name)}</strong>
      <small>${escapeHtml(user.email)}</small>
      <span class="meta-status">${user.online ? 'Available now' : 'Offline'} • ${user.phone || 'No phone added'}</span>
    </div>
    <button type="button" class="small-btn start-chat-btn">Start Chat</button>
  `;

  const startBtn = card.querySelector('.start-chat-btn');
  startBtn.addEventListener('click', () => startPrivateChatWithUser(user));
  container.innerHTML = '';
  container.appendChild(card);
}

function startPrivateChatWithUser(user) {
  if (!user || !state.currentUser) return;

  const idKey = [state.currentUser.email, user.email].sort().join('|');
  let chat = state.chats.find((entry) => entry.type === 'dm' && entry.roomId === `dm-${idKey}`);

  if (!chat) {
    chat = {
      id: `dm-${idKey}`,
      type: 'dm',
      title: user.name,
      roomId: `dm-${idKey}`,
      unread: 0,
      messages: []
    };
    state.chats.unshift(chat);
  }

  state.activeChatId = chat.id;
  if (socket) socket.emit('join-room', { room: chat.roomId, userName: state.currentUser.name });
  render();
}

function registerUser(name, email, password, phone = '') {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanName || !cleanEmail || !password || String(password).length < 8) {
    alert('Please enter your name, a valid email address, and a password with at least 8 characters.');
    return;
  }

  if (state.users.some((user) => normalizeEmail(user.email) === cleanEmail)) {
    alert('That email is already registered.');
    return;
  }

  if (cleanPhone && state.users.some((user) => normalizePhoneNumber(user.phone || '') === cleanPhone)) {
    alert('That phone number is already registered.');
    return;
  }

  const user = { name: cleanName, email: cleanEmail, phone: cleanPhone || null, password: String(password), status: 'Available now', online: true, profileReady: true };
  state.users.push(user);
  state.currentUser = user;
  persistUsers();
  localStorage.setItem('pulsechat-session', JSON.stringify({ email: user.email }));
  saveState();
  render();
}

function loginUser(email, password) {
  const user = state.users.find((entry) => entry.email.toLowerCase() === String(email || '').trim().toLowerCase() && String(entry.password) === String(password));
  if (!user) {
    alert('Invalid email or password.');
    return;
  }

  state.currentUser = user;
  if (typeof user.profileReady === 'undefined') user.profileReady = true;
  user.online = true;
  localStorage.setItem('pulsechat-session', JSON.stringify({ email: user.email }));
  persistUsers();
  saveState();
  render();
}

function logout() {
  state.currentUser = null;
  localStorage.removeItem('pulsechat-session');
  navigateTo('home');
  render();
}

function createDirectChat(name) {
  const targetName = String(name || '').trim();
  if (!targetName) return;

  let chat = state.chats.find((entry) => entry.type === 'dm' && entry.title.toLowerCase() === targetName.toLowerCase());
  if (!chat) {
    chat = { id: `dm-${Date.now()}`, type: 'dm', title: targetName, roomId: `dm-${Date.now()}`, unread: 0, messages: [] };
    state.chats.unshift(chat);
  }

  state.activeChatId = chat.id;
  render();
}

function sendMessage(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const chat = state.chats.find((entry) => entry.id === state.activeChatId);
  if (!chat) return;

  const text = elements.messageInput.value.trim();
  const file = elements.fileInput.files[0];
  if (!text && !file) return;

  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    sender: state.currentUser.name,
    text: text || file.name,
    time: Date.now(),
    replyTo: state.replyTarget ? state.replyTarget.messageId : null,
    attachment: file ? { name: file.name, type: file.type, data: null } : null
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      msg.attachment.data = reader.result;
      chat.messages.push(msg);
      if (socket) socket.emit('chat-message', { room: chat.roomId, sender: msg.sender, text: msg.text, time: msg.time, id: msg.id, type: 'file', attachment: msg.attachment, replyTo: msg.replyTo });
      state.replyTarget = null;
      elements.messageInput.value = '';
      elements.fileInput.value = '';
      saveState();
      render();
    };
    reader.readAsDataURL(file);
    return;
  }

  chat.messages.push(msg);
  if (socket) socket.emit('chat-message', { room: chat.roomId, sender: msg.sender, text: msg.text, time: msg.time, id: msg.id, type: 'text', replyTo: msg.replyTo });
  state.replyTarget = null;
  elements.messageInput.value = '';
  saveState();
  render();
}

function sendVoiceNote() {
  const chat = state.chats.find((entry) => entry.id === state.activeChatId);
  if (!chat || !state.currentUser) return;

  const msg = {
    id: `voice-${Date.now()}`,
    sender: state.currentUser.name,
    text: 'Voice note',
    time: Date.now(),
    replyTo: state.replyTarget ? state.replyTarget.messageId : null
  };

  chat.messages.push(msg);
  if (socket) socket.emit('chat-message', { room: chat.roomId, sender: msg.sender, text: msg.text, time: msg.time, id: msg.id, type: 'voice', replyTo: msg.replyTo });
  state.replyTarget = null;
  saveState();
  render();
}

function handleIncomingMessage(message) {
  if (!message || !message.sender) return;

  let chat = state.chats.find((entry) => entry.roomId === message.room);
  if (!chat) {
    chat = { id: `dm-${Date.now()}`, type: 'dm', title: message.sender, roomId: message.room || `dm-${Date.now()}`, unread: 0, messages: [] };
    state.chats.unshift(chat);
  }

  const entry = {
    id: message.id || `msg-${Date.now()}`,
    sender: message.sender,
    text: message.text || 'Shared item',
    time: message.time || Date.now(),
    replyTo: message.replyTo || null
  };

  const exists = chat.messages.some((item) => item.id === entry.id);
  if (!exists) {
    chat.messages.push(entry);
    if (chat.id !== state.activeChatId) chat.unread = (chat.unread || 0) + 1;
  }

  if (message.sender !== state.currentUser?.name) {
    state.notifications.unshift({
      id: `notice-${Date.now()}`,
      chatId: chat.id,
      sender: message.sender,
      message: message.text,
      time: Date.now(),
      unread: true
    });
  }

  saveState();
  render();
}

function bindEvents() {
  elements.authTabs.forEach((tab) => {
    tab.addEventListener('click', () => navigateTo(tab.dataset.authMode));
  });
  [elements.homeGetStartedBtn, elements.heroGetStartedBtn].forEach((button) => button.addEventListener('click', () => navigateTo('register')));
  [elements.homeSignInBtn, elements.heroSignInBtn].forEach((button) => button.addEventListener('click', () => navigateTo('login')));
  elements.authHomeBtn.addEventListener('click', () => navigateTo('home'));
  window.addEventListener('hashchange', render);

  elements.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loginUser(elements.loginEmail.value, elements.loginPassword.value);
  });

  elements.registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    registerUser(elements.registerName.value, elements.registerEmail.value, elements.registerPassword.value, elements.registerPhone.value);
  });

  elements.gmailSearchBtn.addEventListener('click', () => {
    const value = elements.gmailSearchInput.value.trim();
    const match = getUserByEmail(value);
    renderUserResult(elements.gmailSearchResult, match, value);
  });

  elements.phoneSearchBtn.addEventListener('click', () => {
    const value = elements.phoneSearchInput.value.trim();
    const match = getUserByPhone(value);
    renderUserResult(elements.phoneSearchResult, match, value);
  });

  elements.gmailSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      elements.gmailSearchBtn.click();
    }
  });

  elements.phoneSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      elements.phoneSearchBtn.click();
    }
  });

  elements.welcomeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nextName = sanitizeDisplayName(elements.welcomeNameInput.value);
    if (!nextName) {
      elements.welcomeError.textContent = 'Please enter a valid name.';
      elements.welcomeError.classList.remove('hidden');
      return;
    }

    if (!state.currentUser) {
      elements.welcomeError.textContent = 'No user is active.';
      elements.welcomeError.classList.remove('hidden');
      return;
    }

    state.currentUser.name = nextName;
    state.currentUser.profileReady = true;
    persistUsers();
    localStorage.setItem('pulsechat-session', JSON.stringify({ email: state.currentUser.email }));
    saveState();
    render();
  });

  elements.welcomeAvatarInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !state.currentUser) return;

    const reader = new FileReader();
    reader.onload = () => {
      state.currentUser.avatarData = reader.result;
      elements.welcomeAvatarPreview.src = reader.result;
      elements.welcomeAvatarPreview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  });

  elements.demoLoginBtn.addEventListener('click', () => loginUser('ava@gmail.com', '123456'));
  elements.newChatBtn.addEventListener('click', () => {
    const target = window.prompt('Start a chat with a name');
    if (target) createDirectChat(target);
  });
  elements.mobileBackBtn?.addEventListener('click', () => {
    state.mobileChatOpen = false;
    syncMobileLayout();
  });
  elements.themeToggleBtn.addEventListener('click', () => {
    state.darkMode = !state.darkMode;
    renderTheme();
  });
  elements.logoutBtn.addEventListener('click', logout);
  elements.editProfileBtn.addEventListener('click', () => {
    const nextName = window.prompt('Update your display name', state.currentUser.name || '');
    if (!nextName) return;
    state.currentUser.name = nextName.trim() || state.currentUser.name;
    persistUsers();
    saveState();
    render();
  });
  elements.setStatusBtn.addEventListener('click', () => {
    const nextStatus = window.prompt('Update your status', state.currentUser.status || 'Available now');
    if (!nextStatus) return;
    state.currentUser.status = nextStatus.trim() || 'Available now';
    persistUsers();
    saveState();
    render();
  });
  elements.messageForm.addEventListener('submit', sendMessage);
  elements.clearReplyBtn.addEventListener('click', () => {
    state.replyTarget = null;
    renderReplyBox();
  });
  elements.emojiBtn.addEventListener('click', () => {
    elements.messageInput.value += ' 😊';
    elements.messageInput.focus();
  });
  elements.attachBtn.addEventListener('click', () => elements.fileInput.click());
  elements.voiceBtn.addEventListener('click', sendVoiceNote);
  elements.messageInput.addEventListener('input', () => {
    const chat = state.chats.find((entry) => entry.id === state.activeChatId);
    if (chat && socket) socket.emit('typing', { room: chat.roomId, user: state.currentUser.name, typing: true });
  });
  elements.messageInput.addEventListener('blur', () => {
    const chat = state.chats.find((entry) => entry.id === state.activeChatId);
    if (chat && socket) socket.emit('typing', { room: chat.roomId, user: state.currentUser.name, typing: false });
  });
  document.getElementById('contactSearch').addEventListener('input', renderSidebar);
}

function render() {
  ensureBlankGroup();
  renderAuth();
  if (!state.currentUser) return;
  renderProfile();
  if (state.currentUser.profileReady === true) {
    renderSidebar();
    renderMessages();
    renderReplyBox();
    renderTyping();
    renderOnlineList();
  }
  renderTheme();
  syncMobileLayout();
}

function initialize() {
  state.users = loadUsers();
  state.currentUser = null;
  const session = JSON.parse(localStorage.getItem('pulsechat-session') || 'null');
  if (session) {
    const match = state.users.find((user) => user.email === session.email);
    if (match) state.currentUser = match;
  }
  state.darkMode = localStorage.getItem('pulsechat-theme') !== 'light';
  bindEvents();
  if (!window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#home`);
  setAuthMode(window.location.hash === '#register' ? 'register' : 'login');
  window.addEventListener('resize', () => {
    if (!isMobileLayout()) state.mobileChatOpen = false;
    syncMobileLayout();
  });
  render();
}

if (socket) {
  socket.on('typing', ({ room, user, typing }) => {
    if (!room || user === state.currentUser?.name) return;
    state.typing[room] = typing ? user : null;
    renderTyping();
  });

  socket.on('chat-message', (message) => {
    if (!message || !message.sender) return;
    handleIncomingMessage(message);
  });
}

initialize();
