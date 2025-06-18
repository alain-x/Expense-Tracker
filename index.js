document.addEventListener('DOMContentLoaded', function() {
  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // DOM Elements
  const expenseForm = document.getElementById('expense-form');
  const expensesList = document.getElementById('expenses-list');
  const descriptionInput = document.getElementById('description');
  const amountInput = document.getElementById('amount');
  const dateInput = document.getElementById('date');
  const typeRadios = document.getElementsByName('type');
  const cancelBtn = document.getElementById('cancel-btn');
  const formTitle = document.getElementById('form-title');
  
  // Balance elements
  const totalBalance = document.getElementById('total-balance');
  const totalIncome = document.getElementById('total-income');
  const totalExpense = document.getElementById('total-expense');
  
  // Error elements
  const descriptionError = document.getElementById('description-error');
  const amountError = document.getElementById('amount-error');
  const dateError = document.getElementById('date-error');
  
  // State
  let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
  let editingId = null;
  
  // Initialize the app
  init();
  
  function init() {
    renderExpenses();
    updateBalance();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  // Form submission
  expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const finalAmount = type === 'income' ? amount : -amount;
    
    if (editingId) {
      // Update existing expense
      expenses = expenses.map(exp => 
        exp.id === editingId ? { ...exp, description, amount: finalAmount, date } : exp
      );
      resetForm();
      editingId = null;
    } else {
      // Add new expense
      const newExpense = {
        id: Date.now(),
        description,
        amount: finalAmount,
        date
      };
      expenses.push(newExpense);
      resetForm();
    }
    
    saveToLocalStorage();
    renderExpenses();
    updateBalance();
  });
  
  // Cancel edit
  cancelBtn.addEventListener('click', function() {
    resetForm();
    editingId = null;
  });
  
  // Validate form
  function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    descriptionError.textContent = '';
    amountError.textContent = '';
    dateError.textContent = '';
    descriptionInput.classList.remove('error');
    amountInput.classList.remove('error');
    dateInput.classList.remove('error');
    
    // Validate description
    if (!descriptionInput.value.trim()) {
      descriptionError.textContent = 'Description is required';
      descriptionInput.classList.add('error');
      isValid = false;
    }
    
    // Validate amount
    if (!amountInput.value) {
      amountError.textContent = 'Amount is required';
      amountInput.classList.add('error');
      isValid = false;
    } else if (isNaN(amountInput.value)) {
      amountError.textContent = 'Amount must be a number';
      amountInput.classList.add('error');
      isValid = false;
    } else if (parseFloat(amountInput.value) <= 0) {
      amountError.textContent = 'Amount must be positive';
      amountInput.classList.add('error');
      isValid = false;
    }
    
    // Validate date
    if (!dateInput.value) {
      dateError.textContent = 'Date is required';
      dateInput.classList.add('error');
      isValid = false;
    }
    
    return isValid;
  }
  
  // Reset form
  function resetForm() {
    expenseForm.reset();
    formTitle.textContent = 'Add New Expense';
    cancelBtn.style.display = 'none';
    
    // Clear errors
    descriptionError.textContent = '';
    amountError.textContent = '';
    dateError.textContent = '';
    descriptionInput.classList.remove('error');
    amountInput.classList.remove('error');
    dateInput.classList.remove('error');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  // Render expenses list
  function renderExpenses() {
    if (expenses.length === 0) {
      expensesList.innerHTML = '<div class="empty-list">No expenses added yet</div>';
      return;
    }
    
    expensesList.innerHTML = '';
    
    // Sort by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
      const li = document.createElement('li');
      li.className = expense.amount >= 0 ? 'income' : 'expense';
      
      li.innerHTML = `
        <div class="expense-info">
          <span class="description">${expense.description}</span>
          <span class="amount">
            ${expense.amount >= 0 ? '+' : '-'}$${Math.abs(expense.amount).toFixed(2)}
          </span>
          <span class="date">${formatDate(expense.date)}</span>
        </div>
        <div class="expense-actions">
          <button class="edit-btn" data-id="${expense.id}">Edit</button>
          <button class="delete-btn" data-id="${expense.id}">Delete</button>
        </div>
      `;
      
      expensesList.appendChild(li);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEdit);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDelete);
    });
  }
  
  // Handle edit
  function handleEdit(e) {
    const id = parseInt(e.target.dataset.id);
    const expenseToEdit = expenses.find(exp => exp.id === id);
    
    if (expenseToEdit) {
      editingId = id;
      formTitle.textContent = 'Edit Expense';
      cancelBtn.style.display = 'block';
      
      descriptionInput.value = expenseToEdit.description;
      amountInput.value = Math.abs(expenseToEdit.amount);
      dateInput.value = expenseToEdit.date;
      
      if (expenseToEdit.amount >= 0) {
        typeRadios[0].checked = true;
      } else {
        typeRadios[1].checked = true;
      }
    }
  }
  
  // Handle delete
  function handleDelete(e) {
    const id = parseInt(e.target.dataset.id);
    expenses = expenses.filter(exp => exp.id !== id);
    
    saveToLocalStorage();
    renderExpenses();
    updateBalance();
  }
  
  // Update balance
  function updateBalance() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const income = expenses
      .filter(exp => exp.amount > 0)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const expense = expenses
      .filter(exp => exp.amount < 0)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    totalBalance.textContent = `Rwf${total.toFixed(2)}`;
    totalBalance.className = total >= 0 ? 'total positive' : 'total negative';
    
    totalIncome.textContent = `+Rwf${income.toFixed(2)}`;
    totalExpense.textContent = `-Rwf${Math.abs(expense).toFixed(2)}`;
  }
  
  // Save to localStorage
  function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }
  
  // Format date for display
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
});