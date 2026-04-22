/**
 * Lumina Ledger - Premium Finance Tracker Logic
 * Automatically calculates totals, remaining balance, and formats rows.
 */

// Application State
const STATE = {
  monthlyBudget: 8000,
  expenses: [] // { id, date, category, desc, amount }
};

// DOM Elements
const els = {
  form: document.getElementById('expense-form'),
  dateInput: document.getElementById('expense-date'),
  categoryInput: document.getElementById('expense-category'),
  descInput: document.getElementById('expense-desc'),
  amountInput: document.getElementById('expense-amount'),
  tbody: document.getElementById('expense-tbody'),
  emptyState: document.getElementById('empty-state'),
  totalSpentEl: document.getElementById('total-spent'),
  remainingBalanceEl: document.getElementById('remaining-balance'),
  clearAllBtn: document.getElementById('clear-all-btn')
};

// Initialization
function init() {
  // Set default date to today
  els.dateInput.valueAsDate = new Date();
  
  // Load expenses from local storage if available
  const savedExpenses = localStorage.getItem('premium_budget_expenses');
  if (savedExpenses) {
    STATE.expenses = JSON.parse(savedExpenses);
  }

  // Event Listeners
  els.form.addEventListener('submit', handleAddExpense);
  els.clearAllBtn.addEventListener('click', handleClearAll);

  // Initial Render
  render();
}

/**
 * Handle form submission
 */
function handleAddExpense(e) {
  e.preventDefault();

  const expense = {
    id: Date.now().toString(),
    date: els.dateInput.value,
    category: els.categoryInput.value,
    desc: els.descInput.value.trim(),
    amount: parseFloat(els.amountInput.value)
  };

  if (!expense.category || expense.amount <= 0 || !expense.desc) {
    alert("Please fill all fields with valid data.");
    return;
  }

  // Add to state and save
  STATE.expenses.push(expense);
  saveState();

  // Reset form partial (keep date, maybe category)
  els.descInput.value = '';
  els.amountInput.value = '';
  els.descInput.focus();

  // Re-render UI
  render();
}

/**
 * Handle deletion of a single expense
 */
function handleDelete(id) {
  STATE.expenses = STATE.expenses.filter(exp => exp.id !== id);
  saveState();
  render();
}

/**
 * Handle clearing all expenses
 */
function handleClearAll() {
  if (STATE.expenses.length === 0) return;
  if (confirm("Are you sure you want to clear all your expenses?")) {
    STATE.expenses = [];
    saveState();
    render();
  }
}

/**
 * Calculates current analytics based on state
 */
function calculateAnalytics() {
  const totalSpent = STATE.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = STATE.monthlyBudget - totalSpent;
  return { totalSpent, remaining };
}

/**
 * Persist to localStorage
 */
function saveState() {
  localStorage.setItem('premium_budget_expenses', JSON.stringify(STATE.expenses));
}

/**
 * Render the entire UI based on current state
 */
function render() {
  // 1. Render Table Rows
  els.tbody.innerHTML = '';
  
  if (STATE.expenses.length === 0) {
    els.emptyState.classList.remove('hidden');
  } else {
    els.emptyState.classList.add('hidden');
    
    // Sort expenses by date descending
    const sortedExpenses = [...STATE.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(exp => {
      const tr = document.createElement('tr');
      
      // Get nice icon based on category
      let iconClass = 'ph-tag';
      if(exp.category === 'Food') iconClass = 'ph-hamburger';
      else if(exp.category === 'Transport') iconClass = 'ph-car';
      else if(exp.category === 'Books') iconClass = 'ph-book-open';
      else if(exp.category === 'Recharge') iconClass = 'ph-device-mobile';
      else if(exp.category === 'Fun') iconClass = 'ph-game-controller';

      tr.innerHTML = `
        <td>${formatDate(exp.date)}</td>
        <td>
          <span class="category-badge badge-${exp.category}">
            <i class="ph ${iconClass}"></i> ${exp.category}
          </span>
        </td>
        <td>${exp.desc}</td>
        <td class="amount-col">₹${exp.amount.toLocaleString('en-IN')}</td>
        <td class="action-col">
          <button class="del-btn" onclick="handleDelete('${exp.id}')" title="Delete">
            <i class="ph ph-trash"></i>
          </button>
        </td>
      `;
      els.tbody.appendChild(tr);
    });
  }

  // 2. Render Analytics Cards
  const { totalSpent, remaining } = calculateAnalytics();
  
  // Format numbers to Indian Rupee format beautifully
  els.totalSpentEl.textContent = `₹${totalSpent.toLocaleString('en-IN', {minimumFractionDigits: 0})}`;
  els.remainingBalanceEl.textContent = `₹${remaining.toLocaleString('en-IN', {minimumFractionDigits: 0})}`;

  // Update remaining balance color based on health
  const remainingCard = els.remainingBalanceEl.closest('.clay-card');
  if (remaining < 0) {
    remainingCard.className = 'balance-card clay-card clay-card-danger'; // Out of budget
  } else if (remaining < STATE.monthlyBudget * 0.2) {
    remainingCard.className = 'balance-card clay-card clay-card-danger'; // Less than 20% left (warning/danger layout reuse)
  } else {
    remainingCard.className = 'balance-card clay-card clay-card-success'; // Healthy
  }
}

/**
 * Format date string to display nicely (e.g. Oct 15, 2023)
 */
function formatDate(dateString) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Start app
init();
