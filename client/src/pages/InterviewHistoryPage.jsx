// client/src/pages/InterviewHistoryPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:3000";
const ITEMS_PER_PAGE = 10; // Show 10 interviews per page

const InterviewHistoryPage = () => {
  const navigate = useNavigate();
  const [allInterviews, setAllInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New unified filter state
  const [filterType, setFilterType] = useState('none'); // 'none' | 'Date' | 'Category' | 'Mode' | 'Branch' | 'Score'
  const [filterValue, setFilterValue] = useState('');   // generic selected value for simple subfilters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateApplied, setDateApplied] = useState(false); // only apply date filter when user clicks Apply
  const [scoreOption, setScoreOption] = useState('none'); // 'none' | 'high-low' | 'low-high' | 'gte-8' | 'gte-5'

  // existing states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const userId = localStorage.getItem("user_id");

  // Fetch history (keeps same backend API)
  const fetchHistory = useCallback(async () => {
    if (!userId) {
      alert("User not authenticated. Redirecting to login.");
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/history/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch interview history');
      const data = await response.json();

      // ensure an array
      const interviewsArr = Array.isArray(data.interviews) ? data.interviews : (data || []);
      // Sort by latest date first
      const sortedHistory = interviewsArr.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllInterviews(sortedHistory);
    } catch (err) {
      console.error("Error loading interview history:", err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Whenever filters/search change reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterValue, dateApplied, fromDate, toDate, scoreOption, searchTerm]);

  // derive dynamic branches from allInterviews (Option 2)
  const branches = useMemo(() => {
    const setBranches = new Set();
    allInterviews.forEach(i => {
      if (i.branch) setBranches.add(i.branch);
    });
    return Array.from(setBranches).sort();
  }, [allInterviews]);

  // Filter & stats computation (returns filteredInterviews + stats)
  const {
    filteredInterviews,
    totalInterviews,
    averageScore,
    bestCategory,
    modeRatioText
  } = useMemo(() => {
    // start from allInterviews
    let arr = allInterviews.slice();

    // Search first (search applied across visible fields)
    if (searchTerm && searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(i =>
        (i.category || '').toLowerCase().includes(q) ||
        (i.mode || '').toLowerCase().includes(q) ||
        (i.branch || '').toLowerCase().includes(q) ||
        (new Date(i.date).toLocaleString() || '').toLowerCase().includes(q)
      );
    }

    // Apply selected filterType
    switch (filterType) {
      case 'Category':
        if (filterValue) {
          arr = arr.filter(i => (i.category || '').toLowerCase() === filterValue.toLowerCase());
        }
        break;

      case 'Mode':
        if (filterValue) {
          arr = arr.filter(i => (i.mode || '').toLowerCase() === filterValue.toLowerCase());
        }
        break;

      case 'Branch':
        if (filterValue) {
          arr = arr.filter(i => (i.branch || '').toLowerCase() === filterValue.toLowerCase());
        }
        break;

      case 'Date':
        if (dateApplied && fromDate && toDate) {
          const start = new Date(fromDate);
          const end = new Date(toDate);
          // include the entire 'to' day by setting time to end of day
          end.setHours(23,59,59,999);
          arr = arr.filter(i => {
            const d = new Date(i.date);
            return d >= start && d <= end;
          });
        }
        break;

      case 'Score':
        if (scoreOption && scoreOption !== 'none') {
          if (scoreOption === 'gte-8') {
            arr = arr.filter(i => (typeof i.totalAverage === 'number') && i.totalAverage >= 8);
          } else if (scoreOption === 'gte-5') {
            arr = arr.filter(i => (typeof i.totalAverage === 'number') && i.totalAverage >= 5);
          } else if (scoreOption === 'high-low') {
            arr = arr.slice().sort((a, b) => (b.totalAverage || 0) - (a.totalAverage || 0));
          } else if (scoreOption === 'low-high') {
            arr = arr.slice().sort((a, b) => (a.totalAverage || 0) - (b.totalAverage || 0));
          }
        }
        break;

      default:
        break;
    }

    // compute stats from filtered array (so analytics reflect filters)
    const total = arr.length;

    let avg = 0;
    if (total > 0) {
      const sum = arr.reduce((s, it) => s + (Number(it.totalAverage) || 0), 0);
      avg = sum / total;
    }

    // best category from filtered array
    const catScores = {};
    arr.forEach(i => {
      const c = i.category || 'Unknown';
      if (!catScores[c]) catScores[c] = [];
      if (typeof i.totalAverage === 'number') catScores[c].push(i.totalAverage);
    });

    let bestCat = 'N/A';
    let bestAvg = -Infinity;
    Object.entries(catScores).forEach(([cat, scores]) => {
      if (scores.length === 0) return;
      const s = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (s > bestAvg) {
        bestAvg = s;
        bestCat = cat;
      }
    });
    if (bestAvg === -Infinity) bestCat = 'N/A';

    // mode ratio from filtered array
    const chatCount = arr.filter(i => i.mode === 'chat').length;
    const virtualCount = arr.filter(i => i.mode === 'virtual').length;
    const modeRatio = `${chatCount} Chat / ${virtualCount} Virtual`;

    return {
      filteredInterviews: arr,
      totalInterviews: total,
      averageScore: avg,
      bestCategory: bestCat,
      modeRatioText: modeRatio
    };
  }, [allInterviews, searchTerm, filterType, filterValue, dateApplied, fromDate, toDate, scoreOption]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInterviews.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentInterviews = filteredInterviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handlers (view / download)
  const handleViewReport = (interviewId) => {
    navigate(`/reports?id=${interviewId}`);
  };

  const handleDownloadPdf = async (interviewId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/interview/download/${interviewId}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-report-${interviewId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("Failed to download report.");
      console.error(err);
    }
  };

  const handleGoBack = () => {
    navigate('/reports');
  };

  // Date apply handler
  const applyDateFilter = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates.");
      return;
    }
    // ensure from <= to
    if (new Date(fromDate) > new Date(toDate)) {
      alert("From date cannot be after To date.");
      return;
    }
    setDateApplied(true);
  };

  // clear date filter
  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateApplied(false);
  };

  // UI Loading/Error states
  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto p-4 pt-10">
        <div className="bg-white shadow-xl rounded-lg p-8 mt-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading interview history...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto p-4 pt-10">
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mt-10">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4 pt-10">
      <div className="bg-white shadow-xl rounded-lg p-8 mt-10">

        {/* Header */}
        <header className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Interview History</h1>
            <p className="text-gray-600 mt-1 text-sm">Track your previous interviews, scores, and detailed reports.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
            >
              ← Back to Selection
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-indigo-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-indigo-600">Total Interviews</h3>
            <p className="text-3xl font-bold text-indigo-800">{totalInterviews}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-green-600">Average Score</h3>
            <p className="text-3xl font-bold text-green-800">
              {averageScore > 0 ? averageScore.toFixed(1) : "--"}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-yellow-600">Best Category</h3>
            <p className="text-3xl font-bold text-yellow-800">{bestCategory}</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-pink-600">Chat vs Virtual</h3>
            <p className="text-2xl font-bold text-pink-800">{modeRatioText}</p>
          </div>
        </section>

        {/* Filters */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm text-gray-600">Filter By:</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                // reset sub-values when type changes
                setFilterValue('');
                setScoreOption('none');
                setDateApplied(false);
              }}
              className="border border-gray-300 rounded-lg p-2 text-gray-700"
            >
              <option value="none">None</option>
              <option value="Date">Date</option>
              <option value="Category">Category</option>
              <option value="Mode">Mode</option>
              <option value="Branch">Branch</option>
              <option value="Score">Score</option>
            </select>

            {/* Sub filter area - renders based on filterType */}
            <div>
              {filterType === 'Category' && (
                <div className="inline-flex space-x-2">
                  <button
                    onClick={() => setFilterValue('HR')}
                    className={`px-3 py-1 rounded-md border ${filterValue === 'HR' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                  >
                    HR
                  </button>
                  <button
                    onClick={() => setFilterValue('Technical')}
                    className={`px-3 py-1 rounded-md border ${filterValue === 'Technical' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                  >
                    Technical
                  </button>
                  <button
                    onClick={() => setFilterValue('Personal')}
                    className={`px-3 py-1 rounded-md border ${filterValue === 'Personal' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setFilterValue('')}
                    className="px-3 py-1 rounded-md border"
                  >
                    Clear
                  </button>
                </div>
              )}

              {filterType === 'Mode' && (
                <div className="inline-flex space-x-2">
                  <button
                    onClick={() => setFilterValue('chat')}
                    className={`px-3 py-1 rounded-md border ${filterValue === 'chat' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setFilterValue('virtual')}
                    className={`px-3 py-1 rounded-md border ${filterValue === 'virtual' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                  >
                    Virtual
                  </button>
                  <button onClick={() => setFilterValue('')} className="px-3 py-1 rounded-md border">Clear</button>
                </div>
              )}

              {filterType === 'Branch' && (
                <div className="inline-flex items-center space-x-2">
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 text-gray-700"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button onClick={() => setFilterValue('')} className="px-3 py-1 rounded-md border">Clear</button>
                </div>
              )}

              {filterType === 'Score' && (
                <div className="inline-flex items-center space-x-2">
                  <select
                    value={scoreOption}
                    onChange={(e) => setScoreOption(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 text-gray-700"
                  >
                    <option value="none">Select Score Option</option>
                    <option value="high-low">Highest → Lowest</option>
                    <option value="low-high">Lowest → Highest</option>
                    <option value="gte-8">Score ≥ 8</option>
                    <option value="gte-5">Score ≥ 5</option>
                  </select>
                  <button onClick={() => setScoreOption('none')} className="px-3 py-1 rounded-md border">Clear</button>
                </div>
              )}

              {filterType === 'Date' && (
                <div className="inline-flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">From</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded-md p-2" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">To</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded-md p-2" />
                  </div>
                  <button onClick={applyDateFilter} className="px-3 py-1 bg-indigo-600 text-white rounded-md">Apply</button>
                  <button onClick={clearDateFilter} className="px-3 py-1 rounded-md border">Clear</button>
                </div>
              )}
            </div>
          </div>

          {/* Search box */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search interviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 px-3 text-gray-700 focus:outline-none focus:ring focus:ring-indigo-200 w-full md:w-64"
            />
            <button
              onClick={() => {
                setFilterType('none');
                setFilterValue('');
                setScoreOption('none');
                setDateApplied(false);
                setFromDate('');
                setToDate('');
                setSearchTerm('');
              }}
              className="px-3 py-1 bg-gray-100 rounded-md border"
            >
              Reset
            </button>
          </div>
        </section>

        {/* Interview Table */}
        <section>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Mode</th>
                  <th className="py-3 px-4 text-left">Branch</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 divide-y divide-gray-200">
                {currentInterviews.length > 0 ? (
                  currentInterviews.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(item.date).toLocaleString()}</td>
                      <td className="py-3 px-4">{item.category}</td>
                      <td className="py-3 px-4">{item.mode}</td>
                      <td className="py-3 px-4">{item.branch || "N/A"}</td>
                      <td className="py-3 px-4 text-center font-semibold text-indigo-700">
                        {item.totalAverage ? `${item.totalAverage.toFixed(1)}/10` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewReport(item._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          View Report
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(item._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-400">
                      No interviews match your filters or search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredInterviews.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex items-center space-x-2 bg-white px-3 py-2 rounded-full shadow-sm border border-gray-200">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"}`}
                >
                  ◀ Prev
                </button>

                {/* Page numbers */}
                {(() => {
                  const total = totalPages;
                  const pages = [];
                  const getRange = (s, e) => { const r=[]; for (let i=s;i<=e;i++) r.push(i); return r; };

                  if (total <= 5) {
                    pages.push(...getRange(1, total));
                  } else {
                    if (currentPage <= 3) {
                      pages.push(...getRange(1,3), '...', total);
                    } else if (currentPage >= total - 2) {
                      pages.push(1, '...', ...getRange(total-2, total));
                    } else {
                      pages.push(1, '...', currentPage-1, currentPage, currentPage+1, '...', total);
                    }
                  }

                  return pages.map((num, idx) => num === '...' ? (
                    <span key={idx} className="px-2 text-gray-400 select-none">...</span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 text-sm font-semibold flex items-center justify-center rounded-full transition-all duration-150 ${currentPage === num ? "bg-indigo-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"}`}
                    >
                      {num}
                    </button>
                  ));
                })()}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600"}`}
                >
                  Next ▶
                </button>
              </nav>
            </div>
          )}
        </section>

        {/* Empty State */}
        {allInterviews.length === 0 && (
          <section className="text-center py-12 text-gray-500">
            <p className="mb-4 text-lg">You haven't completed any interviews yet.</p>
            <button
              onClick={() => navigate('/interview-selection')}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
              Start Your First Interview
            </button>
          </section>
        )}
      </div>
    </main>
  );
};

export default InterviewHistoryPage;
