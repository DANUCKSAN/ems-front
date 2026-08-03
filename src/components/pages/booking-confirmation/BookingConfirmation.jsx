import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Result,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  MailOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/api';
import {
  getBookingConfirmationPresentation,
  getBookingTagColor,
  getPaymentTagColor,
  isTerminalBookingStatus,
} from '../../../utils/bookingPayment';
import './BookingConfirmation.css';

const { Title, Text } = Typography;
const CHECKOUT_POLL_ATTEMPTS = 5;
const CHECKOUT_POLL_INTERVAL_MS = 1500;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount || 0);

const formatDate = (value, options) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleString('en-AU', options);
};

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const sessionId = query.get('session_id');
  const directBookingId = query.get('bookingId');

  useEffect(() => {
    let cancelled = false;
    let hasLoaded = false;

    const waitBeforeRetry = () => new Promise((resolve) => {
      window.setTimeout(resolve, CHECKOUT_POLL_INTERVAL_MS);
    });

    const loadConfirmation = async () => {
      try {
        setLoading(true);
        setError('');

        if (!sessionId && !directBookingId) {
          throw new Error('The booking reference is missing from this confirmation link.');
        }

        const attempts = sessionId ? CHECKOUT_POLL_ATTEMPTS : 1;
        for (let attempt = 0; attempt < attempts && !cancelled; attempt += 1) {
          if (attempt > 0) {
            await waitBeforeRetry();
            if (cancelled) return;
          }

          const checkoutStatus = sessionId
            ? await apiGet(`/api/payments/checkout-session/${encodeURIComponent(sessionId)}`)
            : null;
          const bookingId = checkoutStatus?.bookingId || directBookingId;
          if (!bookingId) {
            throw new Error('The booking could not be resolved from this checkout session.');
          }

          const bookingDetails = await apiGet(`/api/bookings/${encodeURIComponent(bookingId)}`);
          if (cancelled) return;

          setCheckout(checkoutStatus || {
            bookingId,
            bookingStatus: bookingDetails.status,
            paymentStatus: bookingDetails.paymentStatus,
          });
          setBooking(bookingDetails);
          hasLoaded = true;
          setLoading(false);

          if (isTerminalBookingStatus(bookingDetails.status)) {
            break;
          }
        }
      } catch (loadError) {
        if (!cancelled && !hasLoaded) {
          setError(loadError.message || 'Unable to load booking confirmation');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadConfirmation();
    return () => {
      cancelled = true;
    };
  }, [directBookingId, sessionId]);

  if (loading) {
    return (
      <div className="booking-confirmation-page">
        <Card className="booking-confirmation-shell">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="booking-confirmation-page">
        <Card className="booking-confirmation-shell">
          <Alert
            type="error"
            showIcon
            message="Booking confirmation unavailable"
            description={error || 'We could not find that booking.'}
            action={<Button type="primary" onClick={() => navigate('/my-events')}>View my events</Button>}
          />
        </Card>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const paymentStatus = checkout?.paymentStatus || booking.paymentStatus || 'PENDING';
  const reference = booking.reference || booking.bookingReference || booking.id;
  const presentation = getBookingConfirmationPresentation(booking);
  const bookingTagColor = getBookingTagColor(booking.status);
  const paymentTagColor = getPaymentTagColor(paymentStatus);

  return (
    <div className="booking-confirmation-page">
      <div className="booking-confirmation-shell">
        <Result
          status={presentation.resultStatus}
          icon={isConfirmed ? <CheckCircleFilled /> : undefined}
          title={presentation.title}
          subTitle={presentation.subtitle}
          extra={[
            <Button key="events" type="primary"><Link to="/">Explore more events</Link></Button>,
            <Button key="my-events"><Link to="/my-events">View my events</Link></Button>,
          ]}
          className="confirmation-result"
        />

        <Row gutter={[24, 24]}>
          <Col xs={24} xl={15}>
            <Card className="confirmation-main-card" bordered={false}>
              <Space direction="vertical" size={20} className="full-width">
                <div className="confirmation-header">
                  <Space wrap>
                    <Tag color={bookingTagColor}>{booking.status}</Tag>
                    <Tag color={paymentTagColor}>
                      Payment: {paymentStatus}
                    </Tag>
                  </Space>
                  <Title level={2} className="confirmation-title">{booking.eventTitle}</Title>
                  <Text type="secondary">Booking reference {reference}</Text>
                </div>

                <Descriptions column={1} labelStyle={{ fontWeight: 600 }} className="confirmation-descriptions">
                  <Descriptions.Item label="Event date">
                    <Space><CalendarOutlined />{formatDate(booking.eventDate, {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Venue">
                    <Space><EnvironmentOutlined />{booking.location || 'Venue to be announced'}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Booked for">
                    {`${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Guest'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Account email">
                    <Space><MailOutlined />{booking.email}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment method">
                    {booking.totalPrice > 0 ? 'Stripe Checkout' : 'No payment required'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Seats">
                    {booking.selectedSeats?.length ? booking.selectedSeats.join(', ') : 'Assigned by organiser'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Booked at">
                    {formatDate(booking.bookedAt, {
                      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={9}>
            <Space direction="vertical" size={24} className="full-width">
              <Card className="confirmation-side-card" bordered={false}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} xl={24}>
                    <Statistic title="Tickets booked" value={booking.quantity} prefix={<NumberOutlined />} />
                  </Col>
                  <Col xs={24} sm={12} xl={24}>
                    <Statistic title="Order total" value={booking.totalPrice} precision={2} prefix="$" />
                  </Col>
                </Row>
              </Card>

              <Card className="confirmation-side-card" bordered={false}>
                <Space direction="vertical" size={12} className="full-width">
                  <Text strong>Order breakdown</Text>
                  <div className="confirmation-row"><Text>Ticket price</Text><Text>{formatCurrency(booking.ticketPrice)}</Text></div>
                  <div className="confirmation-row"><Text>Quantity</Text><Text>{booking.quantity}</Text></div>
                  <div className="confirmation-row"><Text>Remaining tickets</Text><Text>{booking.remainingTickets}</Text></div>
                  <div className="confirmation-row confirmation-total-row"><Text strong>Total</Text><Text strong>{formatCurrency(booking.totalPrice)}</Text></div>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default BookingConfirmation;
