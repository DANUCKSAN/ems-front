export const TERMINAL_BOOKING_STATUSES = new Set([
  'CONFIRMED',
  'PAYMENT_EXPIRED',
  'PAYMENT_FAILED',
  'PAID_REQUIRES_REVIEW',
  'CANCELLED',
  'REFUNDED',
]);

export const isTerminalBookingStatus = (status) => TERMINAL_BOOKING_STATUSES.has(status);

export const getBookingConfirmationPresentation = (booking) => {
  if (booking.status === 'CONFIRMED') {
    return {
      resultStatus: 'success',
      title: 'Booking confirmed',
      subtitle: `Your reservation for ${booking.eventTitle} is confirmed.`,
    };
  }
  if (booking.status === 'PAID_REQUIRES_REVIEW') {
    return {
      resultStatus: 'warning',
      title: 'Payment received — booking under review',
      subtitle: 'Do not purchase again. EventHub support must review this payment before the booking is valid for entry.',
    };
  }
  if (booking.status === 'PAYMENT_EXPIRED' || booking.status === 'PAYMENT_FAILED') {
    return {
      resultStatus: 'error',
      title: 'Payment was not completed',
      subtitle: 'This seat reservation is no longer active. Return to the event page to check current availability and start a new booking.',
    };
  }
  if (booking.status === 'REFUNDED') {
    return {
      resultStatus: 'info',
      title: 'Booking refunded',
      subtitle: 'The refund was issued to the original payment method. Your bank may take additional time to display it.',
    };
  }
  if (booking.status === 'CANCELLED') {
    return {
      resultStatus: 'info',
      title: 'Booking cancelled',
      subtitle: booking.notificationMessage || 'This booking is no longer valid for entry.',
    };
  }
  return {
    resultStatus: 'info',
    title: 'Payment is processing',
    subtitle: 'Your payment has not reached a final state yet. Do not pay again; check My Events shortly for the latest status.',
  };
};

export const getBookingTagColor = (status) => {
  if (status === 'CONFIRMED') return 'green';
  if (status === 'PAYMENT_FAILED' || status === 'PAYMENT_EXPIRED') return 'red';
  if (status === 'PAID_REQUIRES_REVIEW') return 'orange';
  return 'gold';
};

export const getPaymentTagColor = (status) => {
  if (['PAID', 'NO_PAYMENT_REQUIRED', 'REFUNDED'].includes(status)) return 'green';
  if (['FAILED', 'EXPIRED'].includes(status)) return 'red';
  return 'blue';
};
