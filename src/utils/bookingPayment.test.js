import { describe, expect, it } from 'vitest';
import {
  getBookingConfirmationPresentation,
  getBookingTagColor,
  getPaymentTagColor,
  isTerminalBookingStatus,
} from './bookingPayment';

describe('booking payment presentation', () => {
  it('treats only final booking states as terminal', () => {
    expect(isTerminalBookingStatus('CONFIRMED')).toBe(true);
    expect(isTerminalBookingStatus('PAYMENT_EXPIRED')).toBe(true);
    expect(isTerminalBookingStatus('PENDING_PAYMENT')).toBe(false);
  });

  it('warns customers not to pay again when a paid booking needs review', () => {
    const presentation = getBookingConfirmationPresentation({
      status: 'PAID_REQUIRES_REVIEW',
      eventTitle: 'EventHub Live',
    });

    expect(presentation.resultStatus).toBe('warning');
    expect(presentation.title).toContain('Payment received');
    expect(presentation.subtitle).toContain('Do not purchase again');
  });

  it('shows a terminal error for expired payment holds', () => {
    const presentation = getBookingConfirmationPresentation({
      status: 'PAYMENT_EXPIRED',
      eventTitle: 'EventHub Live',
    });

    expect(presentation.resultStatus).toBe('error');
    expect(presentation.title).toBe('Payment was not completed');
  });

  it('uses the stored cancellation message when available', () => {
    const presentation = getBookingConfirmationPresentation({
      status: 'CANCELLED',
      notificationMessage: 'Your refund is processing.',
    });

    expect(presentation.subtitle).toBe('Your refund is processing.');
  });

  it('keeps pending payments informational', () => {
    const presentation = getBookingConfirmationPresentation({
      status: 'PENDING_PAYMENT',
      eventTitle: 'EventHub Live',
    });

    expect(presentation.resultStatus).toBe('info');
    expect(presentation.subtitle).toContain('Do not pay again');
  });

  it('maps booking and payment states to consistent tag colours', () => {
    expect(getBookingTagColor('CONFIRMED')).toBe('green');
    expect(getBookingTagColor('PAYMENT_FAILED')).toBe('red');
    expect(getPaymentTagColor('REFUNDED')).toBe('green');
    expect(getPaymentTagColor('EXPIRED')).toBe('red');
  });
});
