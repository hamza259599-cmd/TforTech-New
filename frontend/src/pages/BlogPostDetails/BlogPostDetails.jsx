import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./BlogPostDetails.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

function BlogPostDetails() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/blog/${slug}`);

        if (response.status === 404) {
          setError("This article could not be found.");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load this article.");
        }

        const data = await response.json();
        setPost(data.post);
      } catch (fetchError) {
        console.error("Blog post fetch error:", fetchError);
        setError("Unable to load this article right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  return (
    <div className="blog-post-page">
      <Navbar />

      <div className="blog-post-container">
        <div className="blog-post-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/blogging">Blogging</Link>
          <span>/</span>
          <span>{post ? post.title : "Article"}</span>
        </div>

        {loading && (
          <p className="blog-post-status">Loading article...</p>
        )}

        {!loading && error && (
          <div className="blog-post-error">
            <p>{error}</p>
            <Link to="/blogging" className="blog-post-back-link">
              ← Back to Blog
            </Link>
          </div>
        )}

        {!loading && !error && post && (
          <article className="blog-post-article">
            <span className="blog-post-category">
              {post.category || "General"}
            </span>

            <h1>{post.title}</h1>

            <p className="blog-post-date">
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </p>

            {post.image ? (
              <div className="blog-post-cover">
                <img src={post.image} alt={post.title} />
              </div>
            ) : (
              <div className="blog-post-cover blog-post-cover-icon">
                <span>{post.icon || "📝"}</span>
              </div>
            )}

            <p className="blog-post-excerpt">{post.excerpt}</p>

            <div className="blog-post-content">
              {String(post.content || "")
                .split(/\n{2,}/)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>

            <div className="blog-post-footer">
              <Link to="/blogging" className="blog-post-back-link">
                ← Back to Blog
              </Link>

              <Link to="/products" className="blog-post-cta-link">
                Explore Products →
              </Link>
            </div>
          </article>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default BlogPostDetails;
