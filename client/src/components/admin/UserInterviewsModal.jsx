// src/components/admin/UserInterviewsModal.jsx
import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export default function UserInterviewsModal({ user, onClose }) {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const adminToken = localStorage.getItem("admin_token") || null;

  useEffect(() => {
    async function load() {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/interview/history/${user._id}`, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        setInterviews(data.interviews || []);
      } catch (err) {
        console.error("User interviews load error:", err);
        alert("Failed to load user interviews. Check console.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-11/12 max-w-3xl rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">{user.name || "User"}</h3>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
          <div>
            <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">Close</button>
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div>Loading…</div>
          ) : interviews.length === 0 ? (
            <div className="text-gray-500">No interviews found for this user.</div>
          ) : (
            <ul className="space-y-3">
              {interviews.map((it) => (
                <li key={it._id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{it.category} {it.branch ? `(${it.branch})` : ""}</div>
                      <div className="text-sm text-gray-500">Date: {new Date(it.date).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{it.totalAverage ?? "—"}/10</div>
                      <a
                        href={`${API_BASE}/api/interview/download/${it._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600"
                      >
                        Download PDF
                      </a>
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600">View Q&A (expand)</summary>
                    <div className="mt-2">
                      {it.answers && it.answers.length > 0 ? (
                        it.answers.map((a, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="text-sm font-semibold">Q: {a.question}</div>
                            <div className="text-sm text-gray-700">A: {a.userAnswer}</div>
                            <div className="text-xs text-gray-500 mt-1">Score: {a.evaluation?.TotalScore ?? "—"}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No answers recorded.</div>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
