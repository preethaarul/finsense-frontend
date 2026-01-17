import { useEffect, useState } from "react";
import "./Dashboard.css";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { authFetch } from "../utils/authFetch";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function Dashboard() {
  const [summary, setSummary] = useState(undefined);
  const [timeline, setTimeline] = useState(undefined);
  const [ruleInsights, setRuleInsights] = useState(null);
  const [mlInsights, setMlInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [s, t, r, ml, tx] = await Promise.all([
          authFetch(`${API_BASE}/dashboard/summary`),
          authFetch(`${API_BASE}/dashboard/timeline?view=${view}`),
          authFetch(`${API_BASE}/dashboard/rule-insights`),
          authFetch(`${API_BASE}/dashboard/ml-insights`),
          authFetch(`${API_BASE}/transactions`),
        ]);

        setSummary(await s.json());
        setTimeline(await t.json());
        setRuleInsights(await r.json());
        setMlInsights(await ml.json());

        const allTransactions = await tx.json();
        setTransactions(allTransactions.slice(0, 5));
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setSummary(null);
        setTimeline(null);
        setMlInsights(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [view]);

  /* ---------- LOADING / ERROR ---------- */
  if (loading) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading dashboard…</h2>
        </div>
      </div>
    );
  }

  if (!summary || !timeline) {
    return (
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="error-state">
          <h2>Failed to load dashboard</h2>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  /* ---------- DATA EXTRACTION ---------- */
  const monthlyBudget = summary.monthly_budget || 0;
  const expenseThisMonth = summary.expense_this_month || 0;
  const remainingBalance = summary.remaining_balance || 0;

  /* ---------- MONTHLY PROJECTION ---------- */
  const currentDayOfMonth = new Date().getDate();

  const today = new Date();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  const calculateMonthlyProjection = () => {
    if (expenseThisMonth <= 0 || currentDayOfMonth <= 0) {
      return expenseThisMonth;
    }

    const dailyRate = expenseThisMonth / currentDayOfMonth;
    const monthlyProjection = dailyRate * daysInMonth;

    return Math.round(monthlyProjection / 100) * 100;
  };

  const monthlyProjection = calculateMonthlyProjection();
  const vsBudget =
    monthlyBudget > 0 ? monthlyProjection - monthlyBudget : 0;

  const vsBudgetPercent =
    monthlyBudget > 0
      ? Math.round((Math.abs(vsBudget) / monthlyBudget) * 100)
      : 0;

  let projectionClass = "balance-positive";
  let projectionText = "On track";
  let projectionSubtext = "";

  if (monthlyBudget > 0) {
    if (vsBudget > 0) {
      projectionClass = "balance-negative";
      projectionText = `Will exceed by ₹${vsBudget.toLocaleString()}`;
      projectionSubtext = `${vsBudgetPercent}% over budget`;
    } else if (vsBudget < -(monthlyBudget * 0.2)) {
      projectionClass = "balance-positive";
      projectionText = `Will save ₹${Math.abs(vsBudget).toLocaleString()}`;
      projectionSubtext = `${vsBudgetPercent}% under budget`;
    } else {
      projectionText = "Within budget";
      projectionSubtext = "Projection aligned";
    }
  } else {
    projectionClass = "expense";
    projectionText = `₹${monthlyProjection.toLocaleString()}`;
    projectionSubtext = "Projected monthly total";
  }

  /* ---------- BALANCE STATUS ---------- */
  let balanceClass = "balance-positive";
  let balanceText = "Within budget";

  if (remainingBalance < 0) {
    balanceClass = "balance-negative";
    balanceText = "Over budget";
  } else if (
    monthlyBudget > 0 &&
    remainingBalance < monthlyBudget * 0.1
  ) {
    balanceClass = "balance-warning";
    balanceText = "Low balance";
  }

  /* ---------- DONUT CHART ---------- */
  const donutData = {
    labels: Object.keys(summary.category_totals || {}),
    datasets: [
      {
        data: Object.values(summary.category_totals || {}),
        backgroundColor: [
          "#4F46E5",
          "#22C55E",
          "#FACC15",
          "#FB923C",
          "#A855F7",
          "#EF4444",
        ],
        borderWidth: 0,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
    },
    cutout: "60%",
  };

  /* ---------- LINE CHART ---------- */
  const labels = Array.from(
    new Set([
      ...Object.keys(timeline.income || {}),
      ...Object.keys(timeline.expense || {}),
    ])
  ).sort();

  const lineData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: labels.map((l) => timeline.income?.[l] || 0),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        tension: 0.4,
        fill: false,
      },
      {
        label: "Expense",
        data: labels.map((l) => timeline.expense?.[l] || 0),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          padding: 10,
          usePointStyle: true,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: {
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
    },
  };

  const hasRuleInsights =
    ruleInsights &&
    !ruleInsights.message &&
    Object.keys(ruleInsights).length > 0;

  const hasMlInsights =
    mlInsights &&
    mlInsights.anomalies &&
    mlInsights.anomalies.length > 0;

  const hasAnyInsights = hasRuleInsights || hasMlInsights;

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {/* ---------- STATS ---------- */}
      <div className="stats-row">
        <div className="stat-card">
          <h4>Spent This Month</h4>
          <p className="expense">
            ₹{expenseThisMonth.toLocaleString()}
          </p>
          <span className="stat-sub">
            As of {currentDayOfMonth}{" "}
            {currentDayOfMonth === 1 ? "day" : "days"}
          </span>
        </div>

        <div className="stat-card">
          <h4>Monthly Projection</h4>
          <p className={projectionClass}>
            ₹{monthlyProjection.toLocaleString()}
          </p>
          <span className="stat-sub">
            {projectionText}
            {projectionSubtext && (
              <>
                <br />
                <small style={{ opacity: 0.8 }}>
                  {projectionSubtext}
                </small>
              </>
            )}
          </span>
        </div>

        <div className="stat-card">
          <h4>Remaining Balance</h4>
          <p className={balanceClass}>
            ₹{remainingBalance.toLocaleString()}
          </p>
          <span className="stat-sub">{balanceText}</span>
        </div>
      </div>

      {/* ---------- CHARTS ---------- */}
      <div className="charts-row">
        <div className="chart-card">
          <h4>Expense by Category</h4>
          <div className="chart-container">
            <Doughnut data={donutData} options={donutOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4>Income vs Expense</h4>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="chart-container">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* ---------- INSIGHTS ---------- */}
      <div className="insights-section">
        <div className="insight-card">
          <h4>Smart Insights</h4>

          {!hasAnyInsights ? (
            <p className="muted">
              Add more expense data to unlock insights.
            </p>
          ) : (
            <ul>
              {hasRuleInsights && (
                <>
                  <li>
                    Most spending on <b>{ruleInsights.top_category}</b>{" "}
                    ({ruleInsights.top_category_percent}%)
                  </li>
                  <li>
                    You spend more on{" "}
                    <b>{ruleInsights.dominant_days}</b>
                  </li>
                  {ruleInsights.frequent_small_expenses && (
                    <li>Frequent small expenses detected</li>
                  )}
                </>
              )}

              {hasMlInsights && (
                <li className="anomaly-section">
                  <div
                    className="anomaly-toggle"
                    onClick={() =>
                      setShowAnomalyDetails(!showAnomalyDetails)
                    }
                  >
                    ⚠️ AI detected {mlInsights.anomalies.length} unusual
                    transaction
                    {mlInsights.anomalies.length > 1 ? "s" : ""}
                    <span style={{ marginLeft: "8px" }}>
                      {showAnomalyDetails ? "▲" : "▼"}
                    </span>
                  </div>

                  {showAnomalyDetails && (
                    <ul className="anomaly-details">
                      {mlInsights.anomalies.map((a, i) => (
                        <li key={i}>
                          ₹{a.amount.toLocaleString()} • {a.category} (
                          {a.date})
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="insight-card">
          <h4>Latest Transactions</h4>

          {transactions.length === 0 ? (
            <p className="muted">No transactions yet.</p>
          ) : (
            <ul>
              {transactions.map((t) => (
                <li key={t.id}>
                  ₹{t.amount.toLocaleString()} • <b>{t.category}</b> (
                  {t.date})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
