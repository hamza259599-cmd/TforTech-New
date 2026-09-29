import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";

import "./Footer.css";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "http://127.0.0.1:8000";

const API = `${BACKEND_URL}/api`;

// ============================================================
// FOOTER (admin-managed)
// ============================================================

const DEFAULT_FOOTER_SETTINGS = {
  header: {
    announcement_text_1: "Free shipping on orders over PKR 5,000",
    announcement_text_2: "Pakistan & Middle East",
    logo_text_main: "T",
    logo_text_secondary: "For Tech",
  },
  footer: {
    site_name: "GoJuniors",
    description:
      "Discover comfortable clothing, playful toys and accessories made for curious minds and growing hearts.",
    social_links: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      tiktok: "https://tiktok.com",
    },
    shop: {
      title: "Shop",
      links: [
        { label: "All Products", url: "/shop" },
        { label: "Categories", url: "/categories" },
        { label: "New Arrivals", url: "/shop" },
        { label: "Bestsellers", url: "/shop" },
        { label: "On Sale", url: "/shop" },
      ],
    },
    help: {
      title: "Help",
      links: [
        { label: "Shipping Information", url: "/shipping" },
        { label: "Returns & Exchanges", url: "/returns" },
        { label: "FAQs", url: "/faq" },
        { label: "Contact Us", url: "/contact" },
      ],
    },
    company: {
      title: "Company",
      links: [
        { label: "About Us", url: "/about" },
        { label: "Contact", url: "/contact" },
        { label: "Privacy Policy", url: "/privacy" },
        { label: "Terms & Conditions", url: "/terms" },
      ],
    },
    newsletter: {
      title: "Stay in the loop",
      description: "Subscribe for new arrivals, special offers and updates.",
      input_placeholder: "Your email address",
      button_text: "Subscribe",
    },
    delivery: {
      items: [
        { icon: "✓", title: "Quality Products", description: "Carefully selected for kids" },
        { icon: "🚚", title: "Free Shipping", description: "On orders over PKR 5,000" },
        { icon: "↩", title: "Easy Returns", description: "Simple return process" },
      ],
    },
    bottom: {
      copyright_text: "All rights reserved.",
      privacy_label: "Privacy",
      privacy_url: "/privacy",
      terms_label: "Terms",
      terms_url: "/terms",
      contact_label: "Contact",
      contact_url: "/contact",
    },
  },
};


function Footer() {
  const location = useLocation();

  const {
    theme,
  } = useTheme();


  const [footerSettings, setFooterSettings] = useState(DEFAULT_FOOTER_SETTINGS);

  useEffect(() => {
    let isMounted = true;

    const fetchFooterSettings = async () => {
      try {
        const response = await fetch(`${API}/header-footer/public`);

        if (!response.ok) {
          throw new Error(
            `Header/footer request failed with status ${response.status}`
          );
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        setFooterSettings({
          ...DEFAULT_FOOTER_SETTINGS,
          ...(data || {}),
          footer: {
            ...DEFAULT_FOOTER_SETTINGS.footer,
            ...(data?.footer || {}),
            social_links: {
              ...DEFAULT_FOOTER_SETTINGS.footer.social_links,
              ...(data?.footer?.social_links || {}),
            },
            shop: {
              ...DEFAULT_FOOTER_SETTINGS.footer.shop,
              ...(data?.footer?.shop || {}),
            },
            help: {
              ...DEFAULT_FOOTER_SETTINGS.footer.help,
              ...(data?.footer?.help || {}),
            },
            company: {
              ...DEFAULT_FOOTER_SETTINGS.footer.company,
              ...(data?.footer?.company || {}),
            },
            newsletter: {
              ...DEFAULT_FOOTER_SETTINGS.footer.newsletter,
              ...(data?.footer?.newsletter || {}),
            },
            delivery: {
              ...DEFAULT_FOOTER_SETTINGS.footer.delivery,
              ...(data?.footer?.delivery || {}),
            },
            bottom: {
              ...DEFAULT_FOOTER_SETTINGS.footer.bottom,
              ...(data?.footer?.bottom || {}),
            },
          },
        });
      } catch (error) {
        console.error("Error loading footer settings:", error);

        if (isMounted) {
          setFooterSettings(DEFAULT_FOOTER_SETTINGS);
        }
      }
    };

    fetchFooterSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const footerData = footerSettings.footer;


  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
  };


  const isAdminPage =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");


  const showFooter =
    isAdminPage ||
    theme.show_footer !== false;


  const siteName =
    theme.site_name ||
    footerData.site_name ||
    "GoJuniors";


  if (!showFooter) {
    return null;
  }


  return (
    <footer className="site-footer">
      <div className="footer-container">

        {/* =====================================================
            FOOTER TOP
        ====================================================== */}

        <div className="footer-top">

          {/* ===================================================
              BRAND
          =================================================== */}

          <div className="footer-brand">

            <Link
              to="/"
              className="footer-logo"
            >
              {siteName}
            </Link>


            <p className="footer-description">
              {footerData.description}
            </p>


            <div className="footer-socials">

              <a
                href={footerData.social_links.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                Instagram
              </a>


              <a
                href={footerData.social_links.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                Facebook
              </a>


              <a
                href={footerData.social_links.tiktok}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                TikTok
              </a>

            </div>

          </div>


          {/* ===================================================
              SHOP
          =================================================== */}

          <div className="footer-column">

            <h3>
              {footerData.shop.title}
            </h3>


            {(footerData.shop.links || []).map((link, index) => (
              <Link key={`shop-${index}`} to={link.url}>
                {link.label}
              </Link>
            ))}

          </div>


          {/* ===================================================
              HELP
          =================================================== */}

          <div className="footer-column">

            <h3>
              {footerData.help.title}
            </h3>


            {(footerData.help.links || []).map((link, index) => (
              <Link key={`help-${index}`} to={link.url}>
                {link.label}
              </Link>
            ))}

          </div>


          {/* ===================================================
              COMPANY
          =================================================== */}

          <div className="footer-column">

            <h3>
              {footerData.company.title}
            </h3>


            {(footerData.company.links || []).map((link, index) => (
              <Link key={`company-${index}`} to={link.url}>
                {link.label}
              </Link>
            ))}

          </div>


          {/* ===================================================
              NEWSLETTER
          =================================================== */}

          <div className="footer-newsletter">

            <h3>
              {footerData.newsletter.title}
            </h3>


            <p>
              {footerData.newsletter.description}
            </p>


            <form
              className="newsletter-form"
              onSubmit={handleNewsletterSubmit}
            >

              <input
                type="email"
                placeholder={footerData.newsletter.input_placeholder}
                aria-label={footerData.newsletter.input_placeholder}
                required
              />


              <button type="submit">
                {footerData.newsletter.button_text}
              </button>

            </form>

          </div>

        </div>


        {/* =====================================================
            DELIVERY STRIP
        ====================================================== */}

        <div className="footer-delivery">

          {(footerData.delivery.items || []).map((item, index) => (
            <div className="footer-delivery-item" key={`delivery-${index}`}>

              <span className="footer-delivery-icon">
                {item.icon}
              </span>

              <div>
                <strong>
                  {item.title}
                </strong>

                <span>
                  {item.description}
                </span>
              </div>

            </div>
          ))}

        </div>


        {/* =====================================================
            FOOTER BOTTOM
        ====================================================== */}

        <div className="footer-bottom">

          <p>
            © {new Date().getFullYear()} {siteName}. {footerData.bottom.copyright_text}
          </p>


          <div className="footer-legal-links">

            <Link to={footerData.bottom.privacy_url}>
              {footerData.bottom.privacy_label}
            </Link>

            <Link to={footerData.bottom.terms_url}>
              {footerData.bottom.terms_label}
            </Link>

            <Link to={footerData.bottom.contact_url}>
              {footerData.bottom.contact_label}
            </Link>

          </div>

        </div>

      </div>
    </footer>
  );
}


export default Footer;
