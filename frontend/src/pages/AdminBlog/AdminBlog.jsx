import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../AdminLayout/AdminLayout";

import "./AdminBlog.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

const EMPTY_FORM = {
  title: "",
  category: "",
  icon: "📝",
  image: "",
  excerpt: "",
  content: "",
  is_published: true,
};

function AdminBlog() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingPostId, setEditingPostId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

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

  const getToken = () => localStorage.getItem("tfortech_access_token");

  // =========================================================
  // FETCH ALL POSTS (including drafts)
  // =========================================================

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      if (!token) {
        handleAuthenticationFailure();
        return;
      }

      const response = await fetch(`${API_URL}/api/blog/admin/all`, {
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
        setError("Access denied. Only administrators can manage the blog.");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load blog posts.");
      }

      const data = await response.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (fetchError) {
      console.error("Admin blog fetch error:", fetchError);
      setError(
        fetchError.message ||
          "Unable to load blog posts. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem("tfortech_logged_in") === "true";
    const token = getToken();
    const userRole = localStorage.getItem("tfortech_user_role");

    if (!loggedIn || !token) {
      navigate("/login");
      return;
    }

    if (userRole !== "admin") {
      setError("Access denied. Only administrators can access blog management.");
      setLoading(false);
      return;
    }

    fetchPosts();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingPostId("");
    setShowForm(false);
  };

  const handleAddPost = () => {
    setError("");
    setSuccessMessage("");
    setForm(EMPTY_FORM);
    setEditingPostId("");
    setShowForm(true);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleEditPost = (post) => {
    setError("");
    setSuccessMessage("");

    setForm({
      title: post.title || "",
      category: post.category || "",
      icon: post.icon || "📝",
      image: post.image || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      is_published: post.is_published !== false,
    });

    setEditingPostId(post.id);
    setShowForm(true);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  // =========================================================
  // VALIDATE
  // =========================================================

  const validateForm = () => {
    if (!form.title.trim()) return "Post title is required.";
    if (!form.excerpt.trim()) return "Short excerpt is required.";
    if (!form.content.trim()) return "Post content is required.";
    return "";
  };

  // =========================================================
  // CREATE / UPDATE POST
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      if (!token) {
        handleAuthenticationFailure();
        return;
      }

      const postData = {
        title: form.title.trim(),
        category: form.category.trim() || "General",
        icon: form.icon.trim() || "📝",
        image: form.image.trim() || null,
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        is_published: form.is_published,
      };

      const isEditing = Boolean(editingPostId);
      const endpoint = isEditing
        ? `${API_URL}/api/blog/${editingPostId}`
        : `${API_URL}/api/blog/`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.status === 401) {
        handleAuthenticationFailure();
        return;
      }

      if (response.status === 403) {
        setError("Access denied. Only administrators can manage the blog.");
        return;
      }

      if (!response.ok) {
        let errorMessage = isEditing
          ? "Unable to update blog post."
          : "Unable to create blog post.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // Keep default error message.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (isEditing) {
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === data.post.id ? data.post : post
          )
        );
        setSuccessMessage("Blog post updated successfully.");
      } else {
        setPosts((currentPosts) => [data.post, ...currentPosts]);
        setSuccessMessage("Blog post added successfully.");
      }

      resetForm();
    } catch (submitError) {
      console.error("Admin blog save error:", submitError);
      setError(submitError.message || "Unable to save blog post.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE POST
  // =========================================================

  const handleDeletePost = async (postId) => {
    const post = posts.find((item) => item.id === postId);
    const postTitle = post?.title || "this post";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${postTitle}"?`
    );
    if (!confirmed) return;

    try {
      setDeletingId(postId);
      setError("");
      setSuccessMessage("");

      const token = getToken();
      if (!token) {
        handleAuthenticationFailure();
        return;
      }

      const response = await fetch(`${API_URL}/api/blog/${postId}`, {
        method: "DELETE",
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
        setError("Access denied. Only administrators can delete blog posts.");
        return;
      }

      if (!response.ok) {
        let errorMessage = "Unable to delete blog post.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (parseError) {
          // Keep default error message.
        }
        throw new Error(errorMessage);
      }

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );

      if (editingPostId === postId) {
        resetForm();
      }

      setSuccessMessage("Blog post deleted successfully.");
    } catch (deleteError) {
      console.error("Admin blog delete error:", deleteError);
      setError(deleteError.message || "Unable to delete blog post.");
    } finally {
      setDeletingId("");
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-blog-page">
          <main className="admin-blog-main">
            <div className="admin-blog-loading">
              <div className="admin-blog-spinner"></div>
              <h2>Loading Blog Posts</h2>
              <p>Please wait while we load the blog posts.</p>
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
      <div className="admin-blog-page">
        <main className="admin-blog-main">
          <div className="admin-blog-container">
            <section className="admin-blog-header">
              <div>
                <span className="admin-blog-eyebrow">ADMIN PANEL</span>
                <h1>Blog Management</h1>
                <p>Write, edit and publish articles on your store's blog.</p>
              </div>

              <div className="admin-blog-header-actions">
                <button
                  type="button"
                  className="admin-blog-dashboard-button"
                  onClick={() => navigate("/admin")}
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  className="admin-blog-add-button"
                  onClick={handleAddPost}
                >
                  + New Post
                </button>
              </div>
            </section>

            {successMessage && (
              <div className="admin-blog-success">{successMessage}</div>
            )}

            {error && (
              <div className="admin-blog-error">
                <strong>Something went wrong</strong>
                <span>{error}</span>
              </div>
            )}

            {showForm && (
              <section className="admin-blog-form-section">
                <div className="admin-blog-form-header">
                  <div>
                    <span className="admin-blog-section-label">
                      {editingPostId ? "EDIT POST" : "NEW POST"}
                    </span>
                    <h2>{editingPostId ? "Edit Blog Post" : "Write New Post"}</h2>
                  </div>

                  <button
                    type="button"
                    className="admin-blog-cancel-button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>

                <form className="admin-blog-form" onSubmit={handleSubmit}>
                  <div className="admin-blog-form-grid">
                    <div className="admin-blog-field admin-blog-field-wide">
                      <label htmlFor="title">Post Title *</label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={handleInputChange}
                        placeholder="e.g. How to Choose the Right Laptop"
                        required
                      />
                    </div>

                    <div className="admin-blog-field">
                      <label htmlFor="category">Category</label>
                      <input
                        id="category"
                        name="category"
                        type="text"
                        value={form.category}
                        onChange={handleInputChange}
                        placeholder="Laptop Buying Guide"
                      />
                    </div>

                    <div className="admin-blog-field">
                      <label htmlFor="icon">Icon (emoji)</label>
                      <input
                        id="icon"
                        name="icon"
                        type="text"
                        value={form.icon}
                        onChange={handleInputChange}
                        placeholder="💻"
                      />
                    </div>

                    <div className="admin-blog-field admin-blog-field-wide">
                      <label htmlFor="image">Cover Image URL</label>
                      <input
                        id="image"
                        name="image"
                        type="url"
                        value={form.image}
                        onChange={handleInputChange}
                        placeholder="https://example.com/cover.jpg"
                      />
                    </div>

                    <div className="admin-blog-field admin-blog-field-wide">
                      <label htmlFor="excerpt">Short Excerpt *</label>
                      <input
                        id="excerpt"
                        name="excerpt"
                        type="text"
                        value={form.excerpt}
                        onChange={handleInputChange}
                        placeholder="One or two sentences shown in the blog list"
                        required
                      />
                    </div>

                    <div className="admin-blog-field admin-blog-field-wide">
                      <label htmlFor="content">Full Content *</label>
                      <textarea
                        id="content"
                        name="content"
                        rows="10"
                        value={form.content}
                        onChange={handleInputChange}
                        placeholder="Write the full article here..."
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div className="admin-blog-featured-section">
                    <label className="admin-blog-featured-checkbox">
                      <input
                        id="is_published"
                        name="is_published"
                        type="checkbox"
                        checked={form.is_published}
                        onChange={handleInputChange}
                        disabled={saving}
                      />
                      <span>Published (visible on the store)</span>
                    </label>
                  </div>

                  <div className="admin-blog-form-actions">
                    <button
                      type="button"
                      className="admin-blog-secondary-button"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="admin-blog-submit-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingPostId
                        ? "Update Post"
                        : "Publish Post"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="admin-blog-list-section">
              <div className="admin-blog-list-header">
                <div>
                  <span className="admin-blog-section-label">ARTICLES</span>
                  <h2>All Blog Posts</h2>
                </div>

                <div className="admin-blog-count">
                  <strong>{posts.length}</strong>
                  <span>Posts</span>
                </div>
              </div>

              {posts.length === 0 ? (
                <div className="admin-blog-empty">
                  <div className="admin-blog-empty-icon">📝</div>
                  <h3>No Blog Posts Yet</h3>
                  <p>Write your first article to start building your blog.</p>
                  <button
                    type="button"
                    className="admin-blog-add-button"
                    onClick={handleAddPost}
                  >
                    + New Post
                  </button>
                </div>
              ) : (
                <div className="admin-blog-grid">
                  {posts.map((post) => (
                    <article key={post.id} className="admin-post-card">
                      <div className="admin-post-card-image">
                        {post.image ? (
                          <img
                            src={post.image}
                            alt={post.title || "Blog post"}
                            className="admin-post-image"
                          />
                        ) : (
                          <div className="admin-post-image-placeholder">
                            {post.icon || "📝"}
                          </div>
                        )}

                        <span className="admin-post-condition">
                          {post.is_published ? "Published" : "Draft"}
                        </span>
                      </div>

                      <div className="admin-post-card-content">
                        <span className="admin-post-category">
                          {post.category || "General"}
                        </span>

                        <h3>{post.title || "Untitled Post"}</h3>

                        <p>{post.excerpt || "No excerpt available."}</p>

                        <div className="admin-post-actions">
                          <button
                            type="button"
                            className="admin-post-edit-button"
                            onClick={() => handleEditPost(post)}
                            disabled={saving || deletingId === post.id}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-post-delete-button"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletingId === post.id || saving}
                          >
                            {deletingId === post.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

export default AdminBlog;
