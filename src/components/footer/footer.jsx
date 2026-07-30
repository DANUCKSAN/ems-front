import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const currentYear = new Date().getFullYear();

const footerLinks = [
  { label: 'Featured Events', to: '/' },
  { label: 'My Events', to: '/my-events' },
  { label: 'Host Dashboard', to: '/dashboard' },
  { label: 'Register', to: '/register' },
  { label: 'Terms of Service', to: '/terms' },
];

const Footer = () => {
  return (
    <footer className="site_footer">
      <div className="footer_shell">
        <div className="footer_intro">
          <span className="footer_badge">EventHub</span>
          <h2>Plan, publish, and book memorable experiences with confidence.</h2>
          <p>
            Discover events, manage bookings, and stay connected through a polished platform
            built for guests and hosts.
          </p>
        </div>

        <div className="footer_links_block">
          <h3>Quick Links</h3>
          <nav className="footer_links" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link key={link.label} to={link.to} className="footer_link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer_social_block">
          <h3>Built for every role</h3>
          <p>Discover events as an attendee or apply to manage events as a verified host.</p>
          <Link className="footer_link" to="/host-register">Apply to host events</Link>
        </div>
      </div>

      <div className="footer_bottom_bar">
        <p>© {currentYear} EventHub. All rights reserved.</p>
        <p>Secure event discovery, booking, and host management.</p>
      </div>
    </footer>
  );
};

export default Footer;
