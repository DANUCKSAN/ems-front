import { render, screen } from '@testing-library/react';
import Terms from './Terms';

describe('Terms page', () => {
  it('renders the customer-facing payment and refund terms', () => {
    render(<Terms />);

    expect(screen.getByRole('heading', { level: 1, name: 'Terms of service' })).toBeInTheDocument();
    expect(screen.getByText(/Paid bookings are processed by Stripe/i)).toBeInTheDocument();
    expect(screen.getByText(/original payment method/i)).toBeInTheDocument();
  });
});
