import { useEffect, useState } from "react";
import "./AddTransaction.css";
import { useLocation, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Allowance",
  "Business",
  "Investment",
  "Other",
];

// Format today's date for default value
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function AddTransaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingTxn = location.state;

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [description, setDescription] = useState("");

  /* ---------- PREFILL WHEN EDITING ---------- */
  useEffect(() => {
    if (editingTxn) {
      setType(editingTxn.type || "expense");
      setAmount(editingTxn.amount?.toString() || "");
      setCategory(editingTxn.category || "");
      setDate(editingTxn.date || "");
      setDescription(editingTxn.description || "");
    }
  }, [editingTxn]);

  /* ---------- HANDLE TYPE CHANGE ---------- */
  const handleTypeChange = (newType) => {
    setType(newType);

    if (!editingTxn) {
      setCategory("");
    } else {
      const categories =
        newType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

      if (editingTxn.category && !categories.includes(editingTxn.category)) {
        setCategory("");
      } else {
        setCategory(editingTxn.category || "");
      }
    }
  };

  /* ---------- GET CATEGORIES BASED ON TYPE ---------- */
  const getCategories = () => {
    return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0 || isNaN(amountValue)) {
      alert("Please enter a valid amount");
      return;
    }

    if (!category) {
      alert("Please select a category");
      return;
    }

    if (!date) {
      alert("Please select a date");
      return;
    }

    const payload = {
      type,
      amount: amountValue,
      category,
      date,
      description: description.trim(),
    };

    const url = editingTxn
      ? `${API_BASE}/transactions/${editingTxn.id}`
      : `${API_BASE}/transactions`;

    const method = editingTxn ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res) {
        alert("Failed to connect to server");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Error: ${res.status} - ${errorText}`);
        return;
      }

      navigate("/transactions");
    } catch (err) {
      alert("Failed to save transaction. Please try again.");
    }
  };

  const currentCategories = getCategories();

  return (
    <div className="add-expense">
      <h1>{editingTxn ? "Edit Transaction" : "Add Transaction"}</h1>

      <form className="expense-form" onSubmit={handleSubmit}>
        {/* TYPE */}
        <div className="form-group">
          <label>Type</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="type-select"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* AMOUNT */}
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, "");
              const parts = value.split(".");
              if (parts.length > 2) {
                setAmount(parts[0] + "." + parts.slice(1).join(""));
              } else {
                setAmount(value);
              }
            }}
            placeholder="0.00"
            required
            className="amount-input"
          />
        </div>

        {/* CATEGORY */}
        <div className="form-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="category-select"
          >
            <option value="">Select category</option>
            {currentCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {editingTxn && category && (
            <small
              style={{
                color: "#6b7280",
                marginTop: "4px",
                display: "block",
              }}
            >
              Current: {category}
            </small>
          )}
        </div>

        {/* DATE */}
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date || getTodayDate()}
            onChange={(e) => setDate(e.target.value)}
            required
            className="date-input"
            max={getTodayDate()}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="form-group">
          <label>Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="description-input"
          />
        </div>

        <button type="submit" className="submit-btn">
          {editingTxn ? "Save Changes" : "Add Transaction"}
        </button>

        {editingTxn && (
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/transactions")}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default AddTransaction;
