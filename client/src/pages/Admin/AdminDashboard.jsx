import React, { useEffect, useState } from "react";
import { CSVLink } from "react-csv";

const API_BASE = "http://localhost:3000";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, userRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/dashboard`),
          fetch(`${API_BASE}/api/admin/users`),
        ]);

        const dashData = await dashRes.json();
        const userData = await userRes.json();

        setStats(dashData);
        setUsers(userData.users || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-indigo-700 text-center">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Total Users</p>
          <h2 className="text-3xl font-bold">{stats?.totalUsers || 0}</h2>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Total Interviews</p>
          <h2 className="text-3xl font-bold">{stats?.totalInterviews || 0}</h2>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Average Score</p>
          <h2 className="text-3xl font-bold">{stats?.averageScore || 0}</h2>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Registered Users</h2>
          <CSVLink
            data={users}
            filename="insta-iq-users.csv"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Export CSV
          </CSVLink>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
