import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-links">
          <a href="https://github.com/ArcSubash" target="_blank" rel="noopener noreferrer" className="footer-link">
            GitHub
          </a>
          <span className="separator">•</span>
          <a href="https://www.linkedin.com/in/subash11rc/" target="_blank" rel="noopener noreferrer" className="footer-link">
            LinkedIn
          </a>
          <span className="separator">•</span>
          <a href="mailto:subash11rc@gmail.com" className="footer-link">
            Contact
          </a>
        </div>

        <p className="copyright-text">
          © {currentYear} <span className="dev-name">User Management System | Subash B</span> All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
