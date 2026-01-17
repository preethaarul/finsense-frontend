import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import "./Budget.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Budget() {
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expenses, setExpenses] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  /* ---------------- LOAD CURRENT + HISTORY ---------------- */
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        setLoading(true);
        setMessage("");

        // 1. Load current month's budget
        try {
          const currentRes = await authFetch(`${API_BASE}/budget/current`);
          const current = await currentRes.json();

          if (current.amount !== undefined) {
            setAmount(current.amount.toString());
          } else {
            setAmount("");
          }
        } catch {
          setAmount("");
        }

        // 2. Load budget history
        try {
          const historyRes = await authFetch(`${API_BASE}/budgets`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setHistory(Array.isArray(historyData) ? historyData : []);
          } else {
            setHistory([]);
          }
        } catch {
          setHistory([]);
        }

        // 3. Load expenses
        try {
          const expensesRes = await authFetch(`${API_BASE}/transactions?type=expense`);
          if (expensesRes.ok) {
            const transactions = await expensesRes.json();
            const expenseMap = {};
            transactions.forEach(t => {
              const [tYear, tMonth] = t.date.split("-").map(Number);
              const key = `${tYear}-${tMonth}`;
              expenseMap[key] = (expenseMap[key] || 0) + t.amount;
            });
            setExpenses(expenseMap);
          }
        } catch {}

      } finally {
        setLoading(false);
      }
    };

    loadBudgets();
  }, []);

  /* ---------------- SAVE BUDGET ---------------- */
  const saveBudget = async () => {
    const budgetAmount = Number(amount);
    if (!amount || budgetAmount <= 0 || isNaN(budgetAmount)) {
      setMessage("Please enter a valid budget amount");
      return;
    }

    setMessage("Saving budget...");

    try {
      const res = await authFetch(`${API_BASE}/budget`, {
        method: "POST",
        body: JSON.stringify({
          month,
          year,
          amount: budgetAmount,
        }),
      });

      if (res.ok) {
        const savedBudget = await res.json();
        setMessage("Budget saved successfully!");
        setAmount(savedBudget.amount.toString());

        const updatedHistory = history.filter(
          b => !(b.month === month && b.year === year)
        );
        setHistory([savedBudget, ...updatedHistory]);

        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          setMessage(errorJson.detail || "Failed to save budget");
        } catch {
          setMessage(`Error ${res.status}`);
        }
      }
    } catch {
      setMessage("Network error. Please check backend.");
    }
  };

  /* ---------------- HANDLE SAVE CLICK ---------------- */
  const handleSaveClick = () => {
    const existingBudget = history.find(b => b.month === month && b.year === year);
    if (existingBudget) setShowConfirm(true);
    else saveBudget();
  };

  const confirmUpdate = () => {
    setShowConfirm(false);
    saveBudget();
  };

  const cancelUpdate = () => {
    setShowConfirm(false);
    setMessage("Update cancelled");
    setTimeout(() => setMessage(""), 3000);
  };

  const calculateUsage = (budgetMonth, budgetYear) => {
    const key = `${budgetYear}-${budgetMonth}`;
    const expense = expenses[key] || 0;
    const budgetItem = history.find(b => b.month === budgetMonth && b.year === budgetYear);
    const budget = budgetItem ? budgetItem.amount : 0;
    if (budget === 0) return 0;
    return Math.min(100, Math.round((expense / budget) * 100));
  };

  const getStatusClass = (percentage) => {
    if (percentage >= 100) return "status-over";
    if (percentage >= 80) return "status-warning";
    if (percentage >= 50) return "status-mid";
    return "status-good";
  };

  const quickSuggestions = [5000, 10000, 20000, 50000, 100000];
  const existingBudget = history.find(b => b.month === month && b.year === year);

  if (loading) {
    return (
      <div className="budget-container">
        <h1>Monthly Budget</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-container">
      <h1>Monthly Budget</h1>

      {showConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="modal-header">
              <h3>Update Budget</h3>
            </div>
            <div className="modal-content">
              <p>Confirm new budget for {monthNames[month - 1]} {year}</p>
              <div className="amount-display">
                ₹{Number(amount).toLocaleString()}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelUpdate}>Cancel</button>
              <button className="confirm-btn" onClick={confirmUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}

      <div className="budget-card">
        <h3>Set Budget — {monthNames[month - 1]} {year}</h3>

        {existingBudget && (
          <div className="existing-budget-notice">
            <span>Current budget: ₹{existingBudget.amount.toLocaleString()}</span>
          </div>
        )}

        <div className="quick-suggestions">
          <span>Quick set:</span>
          <div className="quick-buttons">
            {quickSuggestions.map(v => (
              <button
                key={v}
                className="quick-btn"
                onClick={() => setAmount(v.toString())}
              >
                ₹{v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <span className="currency">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <button onClick={handleSaveClick} className="save-btn">
          {existingBudget ? "Update Budget" : "Save Budget"}
        </button>

        {message && (
          <p className={`status ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </p>
        )}
      </div>

      <div className="budget-card">
        <h3>Budget History</h3>

        {history.length === 0 ? (
          <p className="muted">No previous budgets set</p>
        ) : (
          <div className="budget-history">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Budget</th>
                  <th>Expense</th>
                  <th>Usage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(b => {
                  const usage = calculateUsage(b.month, b.year);
                  const expense = expenses[`${b.year}-${b.month}`] || 0;
                  const isCurrent = b.month === month && b.year === year;

                  return (
                    <tr key={b.id} className={isCurrent ? "current-month" : ""}>
                      <td>{monthNames[b.month - 1]} {b.year}</td>
                      <td>₹{b.amount.toLocaleString()}</td>
                      <td>₹{expense.toLocaleString()}</td>
                      <td>
                        <div
                          className={`usage-bar ${getStatusClass(usage)}`}
                          style={{ width: `${usage}%` }}
                        >
                          {usage}%
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(usage)}`}>
                          {usage >= 100 ? "Over" : usage >= 80 ? "High" : usage >= 50 ? "Moderate" : "Good"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Budget;
