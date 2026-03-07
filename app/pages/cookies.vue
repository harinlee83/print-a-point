<template>
  <div class="legal-shell">
    <header class="legal-nav">
      <NuxtLink to="/" class="home-brand">
        <img src="/icons/logo.svg" alt="" />
        <span class="home-brand-text">PRINTAPOINT</span>
      </NuxtLink>
    </header>

    <main class="legal-content">
      <h1>Cookie Policy</h1>
      <p class="legal-updated">Last updated: March 7, 2026</p>

      <p>This Cookie Policy explains how Printapoint ("we," "us," or "our") uses cookies and similar tracking technologies on our website.</p>

      <h2>1. What Are Cookies?</h2>
      <p>Cookies are small text files placed on your device when you visit a website. They help the site remember your preferences, understand how you use the site, and improve your experience. Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain on your device for a set period).</p>

      <h2>2. Cookies We Use</h2>

      <h3>Essential Cookies</h3>
      <p>These cookies are necessary for the website to function. They enable core features like page navigation and secure checkout. The site cannot operate properly without them.</p>
      <div class="legal-table-wrap">
        <table>
          <thead>
            <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
          </thead>
          <tbody>
            <tr><td>Session ID</td><td>Maintains your session while browsing</td><td>Session</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Analytics Cookies</h3>
      <p>We use Google Analytics to understand how visitors interact with our Site. These cookies collect anonymized information about page views, traffic sources, and user behavior to help us improve the Service.</p>
      <div class="legal-table-wrap">
        <table>
          <thead>
            <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
          </thead>
          <tbody>
            <tr><td>_ga</td><td>Distinguishes unique users</td><td>2 years</td></tr>
            <tr><td>_ga_*</td><td>Maintains session state</td><td>2 years</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Third-Party Cookies</h3>
      <p>Our payment processor (Stripe) may set cookies to enable secure payment processing and fraud prevention. These cookies are governed by Stripe's own privacy and cookie policies.</p>

      <h2>3. How to Manage Cookies</h2>
      <p>You can control and manage cookies in several ways:</p>
      <ul>
        <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies through their settings. Note that blocking essential cookies may prevent the site from functioning correctly.</li>
        <li><strong>Google Analytics opt-out:</strong> Install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics Opt-out Browser Add-on</a> to prevent Google Analytics from collecting your data.</li>
      </ul>

      <h2>4. Do Not Track</h2>
      <p>Some browsers offer a "Do Not Track" setting. We currently do not respond to Do Not Track signals, but you can use the cookie management options described above to control tracking.</p>

      <h2>5. Changes to This Policy</h2>
      <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with a revised "Last updated" date.</p>

      <h2>6. Contact Us</h2>
      <p>If you have questions about our use of cookies, contact us at <a href="mailto:admin@printapoint.com">admin@printapoint.com</a>.</p>
    </main>

    <footer class="legal-footer">
      <NuxtLink to="/">← Back to Home</NuxtLink>
    </footer>
  </div>
</template>
