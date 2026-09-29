import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import "./Home.css";

// ============================================================
// BACKEND
// ============================================================

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "http://127.0.0.1:8000";

const API = `${BACKEND_URL}/api`;

// ============================================================
// CATEGORIES
// ============================================================

const categories = [
  {
    title: "Laptops",
    description: "Reliable laptops for work, study and everyday use.",
    icon: "ð»",
  },
  {
    title: "Gaming Laptops",
    description: "Powerful machines built for gaming and performance.",
    icon: "ð®",
  },
  {
    title: "MacBooks",
    description: "Premium Apple laptops for work and creativity.",
    icon: "ï£¿",
  },
  {
    title: "Laptop Accessories",
    description: "Everything you need to complete your setup.",
    icon: "ð",
  },
];

// ============================================================
// BENEFITS
// ============================================================

const benefits = [
  {
    icon: "â",
    title: "Quality Products",
    description:
      "Carefully selected laptops and accessories with quality in mind.",
  },
  {
    icon: "â»",
    title: "Easy Returns",
    description:
      "A simple return process designed to give you complete peace of mind.",
  },
  {
    icon: "ð",
    title: "Fast Delivery",
    description:
      "Get your products delivered safely and conveniently across Pakistan.",
  },
];

// ============================================================
// TESTIMONIALS
// ============================================================

const testimonials = [
  {
    name: "Ahmed Khan",
    text:
      "The laptop arrived exactly as described. The quality and packaging were excellent.",
    rating: 5,
  },
  {
    name: "Hassan Ali",
    text:
      "Very good shopping experience. I found the laptop I needed at a reasonable price.",
    rating: 5,
  },
  {
    name: "Usman Ahmed",
    text:
      "The product quality was great and delivery was quick. Highly recommended.",
    rating: 5,
  },
];

// ============================================================
// HELPERS
// ============================================================

const formatPrice = (price) => {
  return `PKR ${Number(price || 0).toLocaleString("en-PK")}`;
};

const getProductId = (product) => {
  return (
    product?.product_id ||
    product?.id ||
    product?._id ||
    null
  );
};

const getImageUrl = (product) => {
  const image =
    product?.image_url ||
    (Array.isArray(product?.image_urls)
      ? product.image_urls[0]
      : "");

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${BACKEND_URL}${
    image.startsWith("/") ? "" : "/"
  }${image}`;
};

const getDisplayedPrice = (product) => {
  const originalPrice =
    Number(product?.price || 0);

  const discountPrice =
    Number(product?.discount_price);

  if (
    Number.isFinite(discountPrice) &&
    discountPrice > 0 &&
    discountPrice < originalPrice
  ) {
    return discountPrice;
  }

  return originalPrice;
};

const getOriginalPrice = (product) => {
  const originalPrice =
    Number(product?.price || 0);

  const discountPrice =
    Number(product?.discount_price);

  if (
    Number.isFinite(discountPrice) &&
    discountPrice > 0 &&
    discountPrice < originalPrice
  ) {
    return originalPrice;
  }

  return null;
};

// ============================================================
// POPULAR PRODUCT IMAGE
// ============================================================

function PopularProductImage({ product }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [
    product?.image_url,
    product?.image_urls,
  ]);

  const imageUrl = getImageUrl(product);

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={product?.name || "Product"}
        className="product-card-image"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <span className="product-emoji">
      ð»
    </span>
  );
}

// ============================================================
// HOME
// ============================================================

const DEFAULT_HERO = {
  enabled: true,
  badge: "PREMIUM LAPTOPS & ACCESSORIES",
  title: "Technology That Fits Your World",
  description:
    "Discover reliable laptops, gaming machines and essential accessories for work, study, gaming and everyday life.",
  primary_button_text: "View Products",
  primary_button_link: "/products",
  secondary_button_text: "Explore Categories",
  secondary_button_link: "/categories",
  image: "",
  video_enabled: false,
  video: "",
  overlay_opacity: 0.78,
  image_position: "center",
};

function Home() {
  // ==========================================================
  // POPULAR / FEATURED PRODUCTS FROM MONGODB
  // ==========================================================

  const [popularProducts, setPopularProducts] =
    useState([]);

  const [popularProductsLoading, setPopularProductsLoading] =
    useState(true);

  // ==========================================================
  // HERO SECTION (admin-managed)
  // ==========================================================

  const [hero, setHero] = useState(DEFAULT_HERO);

  const [heroMedia, setHeroMedia] = useState("image");

  useEffect(() => {
    let isMounted = true;

    const fetchHero = async () => {
      try {
        const response = await fetch(`${API}/hero/public`);

        if (!response.ok) {
          throw new Error(
            `Hero request failed with status ${response.status}`
          );
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        const loadedHero = {
          ...DEFAULT_HERO,
          ...(data?.hero || {}),
        };

        setHero(loadedHero);

        setHeroMedia(
          loadedHero.video_enabled && loadedHero.video
            ? "video"
            : "image"
        );
      } catch (error) {
        console.error(
          "Error loading hero settings:",
          error
        );

        if (isMounted) {
          setHero(DEFAULT_HERO);
        }
      }
    };

    fetchHero();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================================
  // FETCH ADMIN-SELECTED POPULAR PRODUCTS
  // ==========================================================

  useEffect(() => {
    let isMounted = true;

    const fetchPopularProducts = async () => {
      try {
        const response = await fetch(
          `${API}/products/featured`
        );

        if (!response.ok) {
          throw new Error(
            `Products request failed with status ${response.status}`
          );
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        const productsFromApi = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        /*
          IMPORTANT:

          Backend has a fallback that can return latest products
          when no product is marked as featured.

          We only want products that the admin explicitly selected
          for the homepage.

          Therefore we filter by is_featured === true.
        */

        const selectedPopularProducts =
          productsFromApi.filter(
            (product) =>
              product?.is_featured === true
          );

        setPopularProducts(
          selectedPopularProducts
        );
      } catch (error) {
        console.error(
          "Error loading popular products:",
          error
        );

        if (isMounted) {
          setPopularProducts([]);
        }
      } finally {
        if (isMounted) {
          setPopularProductsLoading(false);
        }
      }
    };

    fetchPopularProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="home-page">

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <Navbar />

      {/* ======================================================
          HERO
      ====================================================== */}

      {hero.enabled && (
        <section
          className="hero-section"
          style={{
            backgroundImage:
              heroMedia === "image" && hero.image
                ? `url("${hero.image}")`
                : undefined,
            backgroundPosition:
              hero.image_position || "center",
          }}
        >
          {heroMedia === "video" &&
            hero.video_enabled &&
            hero.video && (
              <video
                className="hero-background-video"
                src={hero.video}
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={() => setHeroMedia("image")}
                onError={() => setHeroMedia("image")}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

          <div
            className="hero-overlay"
            style={{
              background: `rgba(0,0,0,${
                Number.isFinite(Number(hero.overlay_opacity))
                  ? Number(hero.overlay_opacity)
                  : 0.78
              })`,
            }}
          >
            <div className="hero-content">

              {hero.badge && (
                <span className="hero-badge">
                  {hero.badge}
                </span>
              )}

              <h1>
                {hero.title}
              </h1>

              <p>
                {hero.description}
              </p>

              <div className="hero-buttons">

                <a
                  href={hero.primary_button_link || "/products"}
                  className="primary-button"
                >
                  {hero.primary_button_text || "View Products"}
                </a>

                <a
                  href={hero.secondary_button_link || "/categories"}
                  className="secondary-button"
                >
                  {hero.secondary_button_text || "Explore Categories"}
                </a>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          CATEGORY SECTION
      ====================================================== */}

      <section className="section category-section">

        <div className="section-heading">

          <span className="section-label">
            SHOP BY CATEGORY
          </span>

          <h2>
            Find What You Need
          </h2>

          <p>
            Explore laptops and accessories
            selected for different needs and
            budgets.
          </p>

        </div>

        <div className="category-grid">

          {categories.map(
            (category) => (
              <a
                href={`/products?category=${encodeURIComponent(
                  category.title
                )}`}
                className="category-card"
                key={category.title}
              >

                <div className="category-icon">
                  {category.icon}
                </div>

                <h3>
                  {category.title}
                </h3>

                <p>
                  {category.description}
                </p>

                <span className="card-link">
                  View Products â
                </span>

              </a>
            )
          )}

        </div>
      </section>

      {/* ======================================================
          POPULAR PRODUCTS
          
          IMPORTANT:
          Only admin-selected featured products from MongoDB
          are displayed here.
      ====================================================== */}

      {!popularProductsLoading &&
        popularProducts.length > 0 && (
          <section className="section products-section">

            <div className="section-heading">

              <span className="section-label">
                FEATURED PRODUCTS
              </span>

              <h2>
                Popular Products
              </h2>

              <p>
                Explore some of the products
                selected by our admin.
              </p>

            </div>

            <div className="product-grid">

              {popularProducts.map(
                (product) => {

                  const productId =
                    getProductId(product);

                  const displayedPrice =
                    getDisplayedPrice(
                      product
                    );

                  const originalPrice =
                    getOriginalPrice(
                      product
                    );

                  return (
                    <article
                      className="product-card"
                      key={productId}
                    >

                      {/* ======================================
                          PRODUCT IMAGE
                      ====================================== */}

                      <div className="product-image">

                        <a
                          href={`/products/${productId}`}
                          style={{
                            display:
                              "flex",
                            width:
                              "100%",
                            height:
                              "100%",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            textDecoration:
                              "none",
                          }}
                        >
                          <PopularProductImage
                            product={product}
                          />
                        </a>

                        <span className="product-badge">
                          Featured
                        </span>

                      </div>

                      {/* ======================================
                          PRODUCT INFO
                      ====================================== */}

                      <div className="product-info">

                        <h3>
                          {product?.name ||
                            "Product"}
                        </h3>

                        <div className="product-rating">

                          {"âââââ"}

                          <span>
                            (
                            {Number(
                              product?.review_count ||
                                0
                            )}
                            )
                          </span>

                        </div>

                        <div className="product-price">

                          <strong>
                            {formatPrice(
                              displayedPrice
                            )}
                          </strong>

                          {originalPrice && (
                            <del>
                              {formatPrice(
                                originalPrice
                              )}
                            </del>
                          )}

                        </div>

                        <a
                          href={`/products/${productId}`}
                          className="add-cart-button"
                        >
                          View Description
                        </a>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

            <div className="center-button">

              <a
                href="/products"
                className="outline-button"
              >
                View All Products
              </a>

            </div>

          </section>
        )}

      {/* ======================================================
          WHY CHOOSE US
      ====================================================== */}

      <section className="benefits-section">

        <div className="section-heading">

          <span className="section-label">
            WHY CHOOSE US
          </span>

          <h2>
            Shopping Made Simple
          </h2>

          <p>
            We focus on providing quality
            products and a smooth shopping
            experience.
          </p>

        </div>

        <div className="benefits-grid">

          {benefits.map(
            (benefit) => (
              <div
                className="benefit-card"
                key={benefit.title}
              >

                <div className="benefit-icon">
                  {benefit.icon}
                </div>

                <h3>
                  {benefit.title}
                </h3>

                <p>
                  {benefit.description}
                </p>

              </div>
            )
          )}

        </div>

      </section>

      {/* ======================================================
          DEALS CTA
      ====================================================== */}

      <section className="delivery-section">

        <div className="delivery-content">

          <span className="section-label">
            LATEST DEALS
          </span>

          <h2>
            Upgrade Your Setup Today
          </h2>

          <p>
            Find laptops and accessories
            at competitive prices and choose
            the technology that works best
            for you.
          </p>

          <a
            href="/products"
            className="primary-button"
          >
            Browse Products
          </a>

        </div>

      </section>

      {/* ======================================================
          TESTIMONIALS
      ====================================================== */}

      <section className="section testimonials-section">

        <div className="section-heading">

          <span className="section-label">
            CUSTOMER REVIEWS
          </span>

          <h2>
            What Our Customers Say
          </h2>

          <p>
            Real experiences from customers
            who shop with us.
          </p>

        </div>

        <div className="testimonial-grid">

          {testimonials.map(
            (testimonial) => (
              <article
                className="testimonial-card"
                key={testimonial.name}
              >

                <div className="testimonial-stars">
                  {"â".repeat(
                    testimonial.rating
                  )}
                </div>

                <p>
                  "{testimonial.text}"
                </p>

                <strong>
                  {testimonial.name}
                </strong>

                <span>
                  Verified Customer
                </span>

              </article>
            )
          )}

        </div>

      </section>

      {/* ======================================================
          COMMUNITY / SOCIAL
      ====================================================== */}

      <section className="section community-section">

        <div className="section-heading">

          <span className="section-label">
            OUR STORE
          </span>

          <h2>
            Build Your Perfect Setup
          </h2>

          <p>
            From powerful laptops to
            everyday accessories, find
            everything you need in one
            place.
          </p>

        </div>

        <div className="community-grid">

          <div className="community-box">
            ð»
          </div>

          <div className="community-box">
            â¨ï¸
          </div>

          <div className="community-box">
            ð±ï¸
          </div>

          <div className="community-box">
            ð§
          </div>

        </div>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <Footer />

    </main>
  );
}

export default Home;
