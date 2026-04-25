const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const priorityInput = document.getElementById('priority-input');
const dueInput = document.getElementById('due-input');
const errorText = document.getElementById('error-text');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const priorityFilter = document.getElementById('priority-filter');
const sortBy = document.getElementById('sort-by');
const markAllBtn = document.getElementById('mark-all');
const clearCompletedBtn = document.getElementById('clear-completed');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const pendingCount = document.getElementById('pending-count');
const completedCount = document.getElementById('completed-count');
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statOverdue = document.getElementById('stat-overdue');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const taskTemplate = document.getElementById('task-template');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editText = document.getElementById('edit-text');
const editPriority = document.getElementById('edit-priority');
const editDue = document.getElementById('edit-due');
const cancelEdit = document.getElementById('cancel-edit');
const closeModalTriggers = document.querySelectorAll('[data-close-modal]');

const STORAGE_KEY = 'todo-list-v2';
let tasks = [];
let editingTaskId = null;

const priorityRank = {
  high: 3,
  medium: 2,
  low: 1
};

const normalizeTask = (task) => ({
  id: task.id,
  text: task.text,
  completed: Boolean(task.completed),
  priority: task.priority || 'medium',
  dueAt: task.dueAt || null,
  addedAt: task.addedAt || new Date().toISOString(),
  completedAt: task.completedAt || null
});

const formatDateTime = (isoDate) => {
  if (!isoDate) return 'No due date';
  const date = new Date(isoDate);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const loadTasks = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      tasks = parsed.map(normalizeTask);
    }
  } catch (_error) {
    tasks = [];
  }
};

const setError = (message = '') => {
  errorText.textContent = message;
};

const isTaskOverdue = (task) => {
  if (task.completed || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < Date.now();
};

const getFilteredAndSortedTasks = () => {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = [...tasks];

  if (query) {
    filtered = filtered.filter((task) => task.text.toLowerCase().includes(query));
  }

  if (statusFilter.value !== 'all') {
    const shouldBeCompleted = statusFilter.value === 'completed';
    filtered = filtered.filter((task) => task.completed === shouldBeCompleted);
  }

  if (priorityFilter.value !== 'all') {
    filtered = filtered.filter((task) => task.priority === priorityFilter.value);
  }

  if (sortBy.value === 'oldest') {
    filtered.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
  } else if (sortBy.value === 'dueSoon') {
    filtered.sort((a, b) => {
      const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  } else if (sortBy.value === 'priority') {
    filtered.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);
  } else {
    filtered.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }

  return filtered;
};

const updateStats = () => {
  const total = tasks.length;
  const pending = tasks.filter((task) => !task.completed).length;
  const completed = tasks.filter((task) => task.completed).length;
  const overdue = tasks.filter((task) => isTaskOverdue(task)).length;
  const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);

  statTotal.textContent = String(total);
  statPending.textContent = String(pending);
  statCompleted.textContent = String(completed);
  statOverdue.textContent = String(overdue);
  progressText.textContent = `${ratio}% completed`;
  progressBar.style.width = `${ratio}%`;
};

const createTaskNode = (task) => {
  const node = taskTemplate.content.firstElementChild.cloneNode(true);
  const taskMainEl = node.querySelector('.task-main');
  const priorityBadge = node.querySelector('.badge-priority');
  const dueBadge = node.querySelector('.badge-due');
  const textEl = node.querySelector('.task-text');
  const metaEl = node.querySelector('.task-meta');
  const toggleBtn = node.querySelector('.btn-toggle');
  const editBtn = node.querySelector('.btn-edit');
  const deleteBtn = node.querySelector('.btn-delete');

  priorityBadge.textContent = task.priority.toUpperCase();
  priorityBadge.classList.add(task.priority);

  if (task.dueAt) {
    dueBadge.textContent = `Due: ${formatDateTime(task.dueAt)}`;
    if (isTaskOverdue(task)) {
      dueBadge.classList.add('overdue');
      taskMainEl.classList.add('overdue');
    }
  } else {
    dueBadge.textContent = 'No due date';
  }

  textEl.textContent = task.text;

  const added = `Added: ${formatDateTime(task.addedAt)}`;
  const completed = task.completedAt ? ` | Completed: ${formatDateTime(task.completedAt)}` : '';
  metaEl.textContent = `${added}${completed}`;

  toggleBtn.textContent = task.completed ? 'Reopen' : 'Complete';

  toggleBtn.addEventListener('click', () => {
    tasks = tasks.map((item) => {
      if (item.id !== task.id) return item;
      if (item.completed) {
        return { ...item, completed: false, completedAt: null };
      }
      return { ...item, completed: true, completedAt: new Date().toISOString() };
    });
    saveTasks();
    render();
  });

  editBtn.addEventListener('click', () => {
    editingTaskId = task.id;
    editText.value = task.text;
    editPriority.value = task.priority;
    editDue.value = task.dueAt ? task.dueAt.slice(0, 16) : '';
    editModal.hidden = false;
    editText.focus();
  });

  deleteBtn.addEventListener('click', () => {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    render();
  });

  return node;
};

const renderEmptyState = (list, text) => {
  const li = document.createElement('li');
  li.className = 'empty-state';
  li.textContent = text;
  list.appendChild(li);
};

const render = () => {
  pendingList.innerHTML = '';
  completedList.innerHTML = '';

  const filtered = getFilteredAndSortedTasks();
  const pending = filtered.filter((task) => !task.completed);
  const completed = filtered.filter((task) => task.completed);

  pendingCount.textContent = String(pending.length);
  completedCount.textContent = String(completed.length);
  updateStats();

  if (pending.length === 0) {
    renderEmptyState(pendingList, 'No pending tasks. Add a new task to get started.');
  } else {
    pending.forEach((task) => pendingList.appendChild(createTaskNode(task)));
  }

  if (completed.length === 0) {
    renderEmptyState(completedList, 'No completed tasks yet.');
  } else {
    completed.forEach((task) => completedList.appendChild(createTaskNode(task)));
  }
};

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) {
    setError('Please enter a task before adding.');
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    priority: priorityInput.value,
    dueAt: dueInput.value ? new Date(dueInput.value).toISOString() : null,
    addedAt: new Date().toISOString(),
    completedAt: null
  };

  tasks.unshift(newTask);
  taskInput.value = '';
  dueInput.value = '';
  priorityInput.value = 'medium';
  setError();
  saveTasks();
  render();
});

const closeEditModal = () => {
  editModal.hidden = true;
  editingTaskId = null;
};

editForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const clean = editText.value.trim();
  if (!clean) {
    setError('Task text cannot be empty.');
    return;
  }

  tasks = tasks.map((task) => {
    if (task.id !== editingTaskId) return task;
    return {
      ...task,
      text: clean,
      priority: editPriority.value,
      dueAt: editDue.value ? new Date(editDue.value).toISOString() : null
    };
  });

  setError();
  saveTasks();
  closeEditModal();
  render();
});

cancelEdit.addEventListener('click', closeEditModal);
closeModalTriggers.forEach((trigger) => trigger.addEventListener('click', closeEditModal));

[searchInput, statusFilter, priorityFilter, sortBy].forEach((control) => {
  control.addEventListener('input', render);
  control.addEventListener('change', render);
});

markAllBtn.addEventListener('click', () => {
  const hasPending = tasks.some((task) => !task.completed);
  if (!hasPending) return;

  const completedAt = new Date().toISOString();
  tasks = tasks.map((task) => (task.completed ? task : { ...task, completed: true, completedAt }));
  saveTasks();
  render();
});

clearCompletedBtn.addEventListener('click', () => {
  const count = tasks.filter((task) => task.completed).length;
  if (count === 0) return;
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !editModal.hidden) {
    closeEditModal();
  }
});

loadTasks();
render();
