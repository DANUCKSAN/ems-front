import React from 'react';
import { Card, Typography } from 'antd';
import './Legal.css';

const { Title, Paragraph } = Typography;

const Terms = () => (
  <section className="legal-page" aria-labelledby="terms-heading">
    <Card className="legal-card" variant="borderless">
      <Title id="terms-heading" level={1}>Terms of service</Title>
      <Paragraph type="secondary">Last updated: 30 July 2026</Paragraph>

      <Title level={2}>Using EventHub</Title>
      <Paragraph>
        You must provide accurate account information, keep your account secure, and use the platform only for lawful event discovery, booking, and management.
      </Paragraph>

      <Title level={2}>Bookings and payments</Title>
      <Paragraph>
        Ticket prices and event details are shown before checkout. Paid bookings are processed by Stripe. A booking is confirmed only when EventHub displays a confirmed status.
      </Paragraph>

      <Title level={2}>Cancellations and refunds</Title>
      <Paragraph>
        Cancellation eligibility can depend on the event and applicable consumer law. Approved refunds are returned to the original payment method and may take time to appear with your financial institution.
      </Paragraph>

      <Title level={2}>Hosts and event content</Title>
      <Paragraph>
        Hosts are responsible for accurate listings, lawful events, attendee safety information, and fulfilling advertised commitments. EventHub may review, reject, or remove listings that breach these terms.
      </Paragraph>

      <Title level={2}>Acceptable use</Title>
      <Paragraph>
        Do not misuse accounts, payments, reviews, personal information, platform security, or event inventory. Access may be restricted when necessary to protect customers, hosts, or the service.
      </Paragraph>
    </Card>
  </section>
);

export default Terms;
