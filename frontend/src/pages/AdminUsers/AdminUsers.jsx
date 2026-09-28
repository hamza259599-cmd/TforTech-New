import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../AdminLayout/AdminLayout";

import "./AdminUsers.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  const currentUserId = localStorage.getItem("tfortech_user_id");

  // =========================================================
  // AUTHENTICATION FAILURE
  // =========================================================

  const handleAuthenticationFailure = () => {
    const authKeys = [
      "tfortech_logged_in",
      "tfortech_access_token",
      "tfortech_token_type",
      "tfortech_user_id",
      "tfortech_user_name",
      "tfortech_user_email",
      "tfortech_user_phone",
      "tfortech_user_role",
      "tfortech_remember_me",
    ];

    authKeys.forEach((key) => localStorage.removeItem(key));
    navigate("/login");
  };

  // =========================================================
  // FETCH ALL USERS
  // =========================================================

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("tfortech_access_token");
      const loggedIn = localStorage.getItem("tfortech_logged_in") === "true";
      const userRole = localStorage.getItem("tfortech_user_role");

      if (!token || !loggedIn) {
        handleAuthenticationFailure();
        return;
      }

      if (userRole !== "admin") {
        setError("Access denied. Only administrators can view users.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        handleAuthenticationFailure();
        return;
      }

      if (response.status === 403) {
        setError("Access denied. Only administrators can view users.");
        return;
      }

      if (!response.ok) {
        let errorMessage = "Unable to load users.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // Keep default error message.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid users data received from the server.");
      }

      setUsers(data);
    } catch (fetchError) {
      console.error("Admin users fetch error:", fetchError);
      setError(fetchError.message || "Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // =========================================================
  // UPDATE USER ROLE
  // =========================================================

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("tfortech_access_token");

      if (!token) {
        handleAuthenticationFailure();
        return;
      }

      const response = await fetch(
        `${API_URL}/api/auth/admin/users/${userId}/role?new_role=${encodeURIComponent(
          newRole
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        handleAuthenticationFailure();
        return;
      }

      if (!response.ok) {
        let errorMessage = "Unable to update user role.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // Keep default error message.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      setUsers((currentUsers) =>
        currentUsers.map((u) => (u.id === data.user.id ? data.user : u))
      );

      setSuccessMessage(`${data.user.full_name || "User"} is now ${newRole}.`);
    } catch (updateError) {
      console.error("User role update error:", updateError);
      setError(updateError.message || "Unable to update user role.");
    } finally {
      setUpdatingUserId("");
    }
  };

  // =========================================================
  // EMAIL SEARCH (find a user by email and grant/remove admin)
  // =========================================================

  const normalizedSearch = emailSearch.trim().toLowerCase();

  const filteredUsers = normalizedSearch
    ? users.filter((u) => {
        const email = (u.email || "").toLowerCase();
        const name = (u.full_name || "").toLowerCase();
        return email.includes(normalizedSearch) || name.includes(normalizedSearch);
      })
    : users;

  const exactEmailMatch = normalizedSearch
    ? users.some((u) => (u.email || "").toLowerCase() === normalizedSearch)
    : false;

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-users-page">
          <main className="admin-users-container">
            <div className="admin-users-loading">
              <div className="admin-users-spinner"></div>
              <h2>Loading Users</h2>
              <p>Please wait while we load registered users.</p>
            </div>
          </main>
        </div>
      </AdminLayout>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <AdminLayout>
      <div className="admin-users-page">
        <main className="admin-users-container">
          <section className="admin-users-header">
            <div>
              <span className="admin-users-eyebrow">ADMIN PANEL</span>
              <h1>Users</h1>
              <p>View registered users and manage their admin access.</p>
            </div>

            <div className="admin-users-header-actions">
              <div className="admin-users-count">
                <strong>{users.length}</strong>
                <span>Total Users</span>
              </div>

              <button
                type="button"
                className="admin-users-home-button"
                onClick={() => navigate("/")}
              >
                Back to Store
              </button>
            </div>
          </section>

          {successMessage && (
            <div className="admin-users-success">{successMessage}</div>
          )}

          {error && (
            <div className="admin-users-error">
              <strong>Something went wrong</strong>
              <span>{error}</span>
            </div>
          )}

          {users.length > 0 && (
            <section className="admin-users-search">
              <label htmlFor="admin-users-email-search" className="admin-users-search-label">
                Find a user by email or name
              </label>
              <input
                id="admin-users-email-search"
                type="text"
                className="admin-users-search-input"
                placeholder="e.g. someone@example.com"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
              />
              {normalizedSearch && !exactEmailMatch && (
                <p className="admin-users-search-hint">
                  No registered user matches "{emailSearch}" yet. They'll show up here
                  once they sign up — you can grant admin at that point.
                </p>
              )}
            </section>
          )}

          {!error && users.length === 0 && (
            <section className="admin-users-empty">
              <div className="admin-users-empty-icon">👤</div>
              <h2>No Users Yet</h2>
              <p>No one has registered on the store yet.</p>
            </section>
          )}

          {users.length > 0 && filteredUsers.length === 0 && (
            <section className="admin-users-empty">
              <div className="admin-users-empty-icon">🔍</div>
              <h2>No Matches</h2>
              <p>No registered user matches that search.</p>
            </section>
          )}

          {filteredUsers.length > 0 && (
            <section className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.full_name || "N/A"}</td>
                      <td>{u.email || "N/A"}</td>
                      <td>{u.phone || "N/A"}</td>
                      <td>
                        <span
                          className={`admin-users-role-badge ${
                            u.role === "admin"
                              ? "admin-users-role-admin"
                              : "admin-users-role-customer"
                          }`}
                        >
                          {u.role || "customer"}
                        </span>
                      </td>
                      <td>
                        {u.role === "admin" ? (
                          <button
                            type="button"
                            className="admin-users-action-button admin-users-action-demote"
                            disabled={
                              updatingUserId === u.id || u.id === currentUserId
                            }
                            title={
                              u.id === currentUserId
                                ? "You cannot remove your own admin access"
                                : ""
                            }
                            onClick={() => handleRoleChange(u.id, "customer")}
                          >
                            {updatingUserId === u.id
                              ? "Updating..."
                              : "Remove Admin"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-users-action-button admin-users-action-promote"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleRoleChange(u.id, "admin")}
                          >
                            {updatingUserId === u.id
                              ? "Updating..."
                              : "Make Admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}

export default AdminUsers;
