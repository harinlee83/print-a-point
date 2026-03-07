<template>
  <div class="legal-shell">
    <header class="legal-nav">
      <NuxtLink to="/" class="home-brand">
        <img src="/icons/logo.svg" alt="" />
        <span class="home-brand-text">PRINTAPOINT</span>
      </NuxtLink>
    </header>

    <main class="legal-content">
      <h1>Privacy Policy</h1>
      <p class="legal-updated">Last updated: March 7, 2026</p>

      <p>Printapoint ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use the Printapoint website and services (the "Service").</p>

      <h2>1. Information We Collect</h2>

      <h3>Information you provide</h3>
      <p>When you place an order or use our design tool, we may collect:</p>
      <ul>
        <li>Name and email address</li>
        <li>Shipping address</li>
        <li>Map design preferences and customization data</li>
      </ul>
      <p>We do <strong>not</strong> collect or store your payment card details. All payment processing is handled securely by Stripe.</p>

      <h3>Location data</h3>
      <p>When you use our map design tool, your browser may ask for permission to access your location. This is used solely to center the map on your current location for convenience. Your precise location is processed locally in your browser and is <strong>not</strong> transmitted to or stored on our servers. You can deny the location request and manually enter any location instead.</p>

      <h3>Information collected automatically</h3>
      <p>When you visit our Site, we automatically collect certain information through cookies and similar technologies, including:</p>
      <ul>
        <li>IP address and approximate location</li>
        <li>Browser type and device information</li>
        <li>Pages visited, time spent, and navigation patterns</li>
        <li>Referring website or source</li>
      </ul>
      <p>We use Google Analytics to collect and analyze this data. See our <NuxtLink to="/cookies">Cookie Policy</NuxtLink> for more details.</p>

      <h2>2. How We Use Your Information</h2>
      <p>We use your personal information to:</p>
      <ul>
        <li>Process and fulfill your orders (via Printful)</li>
        <li>Send order confirmations and shipping updates</li>
        <li>Respond to customer support inquiries</li>
        <li>Improve our website, design tools, and user experience</li>
        <li>Analyze site usage and traffic patterns (via Google Analytics)</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. Third-Party Services</h2>
      <p>We share your information with the following third-party services, only as necessary to provide the Service:</p>

      <h3>Stripe (Payment Processing)</h3>
      <p>When you make a purchase, your payment information is sent directly to Stripe. We never see or store your full card details. Stripe's privacy policy governs their handling of your payment data. <a href="https://stripe.com/privacy" target="_blank" rel="noopener">View Stripe's Privacy Policy</a>.</p>

      <h3>Printful (Order Fulfillment)</h3>
      <p>To fulfill your order, we share your name, shipping address, and product details with Printful. Printful handles printing, packaging, and shipping. <a href="https://www.printful.com/policies/privacy" target="_blank" rel="noopener">View Printful's Privacy Policy</a>.</p>

      <h3>Google Analytics</h3>
      <p>We use Google Analytics to understand how visitors interact with our Site. Google Analytics uses cookies to collect anonymized usage data. You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics Opt-out Browser Add-on</a>.</p>

      <h3>OpenStreetMap</h3>
      <p>Our map design tool uses data from OpenStreetMap. When you use the map tool, tile requests may be sent to OpenStreetMap servers, which may log your IP address per their own privacy practices.</p>

      <h3>Cloudflare R2 (Design Storage)</h3>
      <p>When you place an order, your finalized map design is temporarily uploaded to Cloudflare R2 cloud storage. This is necessary to provide a design file URL to Printful for printing. Design files are retained only as long as needed for order fulfillment and may be deleted afterward. No personal information beyond the design image itself is stored in R2. <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">View Cloudflare's Privacy Policy</a>.</p>

      <h2>4. Data Retention</h2>
      <p>We retain your personal information only for as long as necessary to fulfill the purposes described in this policy, including order fulfillment, customer support, and legal compliance. You may request deletion of your data at any time by contacting us.</p>

      <h2>5. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Object to or restrict processing of your data</li>
        <li>Request portability of your data</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p>To exercise any of these rights, contact us at <a href="mailto:admin@printapoint.com">admin@printapoint.com</a>.</p>

      <h2>6. Data Security</h2>
      <p>We take reasonable measures to protect your personal information from unauthorized access, alteration, or destruction. All data is transmitted over HTTPS. Payment data is handled entirely by Stripe's PCI-compliant infrastructure.</p>

      <h2>7. Children's Privacy</h2>
      <p>The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn that we have collected data from a child, we will delete it promptly.</p>

      <h2>8. International Transfers</h2>
      <p>Your data may be processed in countries outside your own, including by our third-party providers (Stripe, Printful, Google). By using the Service, you consent to such transfers. We ensure that appropriate safeguards are in place.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised "Last updated" date. Your continued use of the Service after any changes constitutes acceptance of the updated policy.</p>

      <h2>10. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy or your personal data, contact us at <a href="mailto:admin@printapoint.com">admin@printapoint.com</a>.</p>
    </main>

    <footer class="legal-footer">
      <NuxtLink to="/">← Back to Home</NuxtLink>
    </footer>
  </div>
</template>
