import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Rate,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import './EventDetails.css';
import { apiGet, apiPost } from '../../../utils/api';
import eventPlaceholder from '../../../assets/event-placeholder.svg';

const { Title, Paragraph, Text } = Typography;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount || 0);

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      year: 'numeric',
      })
    : 'TBA';

const averageRating = (items) => {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
};

const EventDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [event, setEvent] = useState(() => {
    const routeEvent = location.state?.event;
    if (routeEvent) {
      return routeEvent;
    }

    return null;
  });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [resumingCheckout, setResumingCheckout] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [seatLayout, setSeatLayout] = useState(null);
  const [seatLayoutLoading, setSeatLayoutLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const checkoutRequestKey = useRef(null);
  const [reviewForm] = Form.useForm();
  const returnQuery = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const cancelledBookingId = returnQuery.get('payment') === 'cancelled'
    ? returnQuery.get('booking_id')
    : null;

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (parseError) {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await apiGet(`/api/events/${id}`, { auth: false });
        setEvent(data);
      } catch (fetchError) {
        setEvent(null);
        setError(fetchError.message || 'Unable to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, location.state]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewLoading(true);
        const data = await apiGet(`/api/reviews/event/${id}`, { auth: false });
        setReviews(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchSeatLayout = async () => {
      try {
        setSeatLayoutLoading(true);
        const data = await apiGet(`/api/bookings/layout/${id}`, { auth: false });
        setSeatLayout(data);
      } catch (layoutError) {
        setSeatLayout(null);
      } finally {
        setSeatLayoutLoading(false);
      }
    };

    fetchSeatLayout();
  }, [id]);

  useEffect(() => {
    setSelectedSeats((current) => current.slice(0, quantity));
  }, [quantity]);

  useEffect(() => {
    checkoutRequestKey.current = null;
  }, [id, quantity, selectedSeats]);

  const availableTickets = seatLayout?.availableSeats ?? event?.ticketQuantity ?? 0;
  const totalPrice = (event?.ticketPrice || 0) * quantity;
  const eventAverageRating = averageRating(reviews);
  const seatsByRow = useMemo(() => {
    if (!seatLayout?.seats?.length) {
      return [];
    }

    return seatLayout.seats.reduce((rows, seat) => {
      const rowIndex = seat.row - 1;
      if (!rows[rowIndex]) {
        rows[rowIndex] = {
          row: seat.row,
          seats: [],
        };
      }
      rows[rowIndex].seats.push(seat);
      return rows;
    }, []);
  }, [seatLayout]);

  const toggleSeatSelection = (seat) => {
    if (seat.status === 'BOOKED') {
      return;
    }

    setSelectedSeats((current) => {
      if (current.includes(seat.label)) {
        return current.filter((item) => item !== seat.label);
      }

      if (current.length >= quantity) {
        messageApi.warning(`You can select up to ${quantity} seat${quantity > 1 ? 's' : ''}.`);
        return current;
      }

      return [...current, seat.label];
    });
  };

  const handleBooking = async () => {
    if (!user?.id) {
      localStorage.setItem('redirectAfterLogin', `/event/${id}`);
      navigate('/login', { state: { redirectTo: `/event/${id}` } });
      return;
    }

    if (selectedSeats.length !== quantity) {
      messageApi.error(`Please select exactly ${quantity} seat${quantity > 1 ? 's' : ''}.`);
      return;
    }

    try {
      setBooking(true);
      if (!checkoutRequestKey.current) {
        checkoutRequestKey.current = window.crypto.randomUUID();
      }

      const payload = await apiPost(
        '/api/payments/checkout-session',
        {
          eventId: Number(id),
          quantity,
          selectedSeats,
        },
        { headers: { 'Idempotency-Key': checkoutRequestKey.current } }
      );

      if (payload.requiresPayment) {
        if (!payload.checkoutUrl) {
          throw new Error('Secure checkout is temporarily unavailable. Please try again.');
        }
        window.location.assign(payload.checkoutUrl);
        return;
      }

      messageApi.success('Your free booking is confirmed');
      navigate(`/booking-confirmation?bookingId=${payload.bookingId}`, { replace: true });
    } catch (bookingError) {
      messageApi.error(bookingError.message || 'Checkout could not be started');
    } finally {
      setBooking(false);
    }
  };

  const handleResumeCheckout = async () => {
    if (!user?.id) {
      const returnPath = `/event/${id}${location.search}`;
      localStorage.setItem('redirectAfterLogin', returnPath);
      navigate('/login', { state: { redirectTo: returnPath } });
      return;
    }
    if (!cancelledBookingId) {
      messageApi.error('The cancelled checkout could not be identified. Please start again.');
      return;
    }

    try {
      setResumingCheckout(true);
      const payload = await apiPost(
        `/api/payments/checkout-session/${encodeURIComponent(cancelledBookingId)}/resume`,
        null
      );
      if (payload.requiresPayment) {
        if (!payload.checkoutUrl) {
          throw new Error('Secure checkout is temporarily unavailable. Please try again.');
        }
        window.location.assign(payload.checkoutUrl);
        return;
      }

      const confirmationQuery = payload.checkoutSessionId
        ? `session_id=${encodeURIComponent(payload.checkoutSessionId)}`
        : `bookingId=${encodeURIComponent(payload.bookingId)}`;
      navigate(`/booking-confirmation?${confirmationQuery}`, { replace: true });
    } catch (resumeError) {
      messageApi.error(resumeError.message || 'Checkout could not be resumed');
    } finally {
      setResumingCheckout(false);
    }
  };

  const handleReviewSubmit = async (values) => {
    if (!user?.id) {
      localStorage.setItem('redirectAfterLogin', `/event/${id}`);
      navigate('/login', { state: { redirectTo: `/event/${id}` } });
      return;
    }

    try {
      setReviewSubmitting(true);
      const payload = await apiPost('/api/reviews', {
          eventId: Number(id),
          rating: values.rating,
          comment: values.comment,
      });

      setReviews((current) => [payload, ...current]);
      reviewForm.resetFields();
      messageApi.success('Review added successfully');
    } catch (submitError) {
      messageApi.error(submitError.message || 'Review submission failed');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="event-details-page">
        {contextHolder}
        <Card className="event-details-shell">
          <Skeleton.Image active className="event-details-skeleton-image" />
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-details-page">
        {contextHolder}
        <Card className="event-details-shell">
          <Empty
            description={error || 'This event is unavailable right now.'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary">
              <Link to="/">Back to events</Link>
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="event-details-page">
      {contextHolder}
      <div className="event-details-shell">
        <Breadcrumb
          className="event-details-breadcrumb"
          items={[
            { title: <Link to="/">Events</Link> },
            { title: event.title },
          ]}
        />

        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} lg={15}>
            <Card className="event-hero-card" bordered={false}>
              <Image
                className="event-hero-image"
                src={event.imageUrl || eventPlaceholder}
                alt={event.title}
                preview={false}
              />
              <div className="event-hero-content">
                <Space size={[8, 8]} wrap>
                  <Tag color="gold">{event.category || 'Featured event'}</Tag>
                  <Tag color={availableTickets > 0 ? 'green' : 'red'}>
                    {availableTickets > 0 ? 'Tickets available' : 'Sold out'}
                  </Tag>
                </Space>

                <Title level={1} className="event-title">
                  {event.title}
                </Title>

                <Paragraph className="event-description-copy">
                  {event.description || 'More event details will be shared soon.'}
                </Paragraph>

                <Row gutter={[16, 16]} className="event-stats-row">
                  <Col xs={24} sm={8}>
                    <Card className="event-stat-card" bordered={false}>
                      <Statistic
                        title="Event date"
                        prefix={<CalendarOutlined />}
                        value={formatDate(event.date)}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="event-stat-card" bordered={false}>
                      <Statistic
                        title="Location"
                        prefix={<EnvironmentOutlined />}
                        value={event.location || 'Venue to be announced'}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="event-stat-card" bordered={false}>
                      <Statistic
                        title="Ticket price"
                        prefix={<TagOutlined />}
                        value={formatCurrency(event.ticketPrice)}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card className="booking-panel-card" bordered={false}>
              <Space direction="vertical" size={18} className="full-width">
                <div>
                  <Text className="booking-panel-label">Reserve your place</Text>
                  <Title level={3} className="booking-panel-title">
                    Booking summary
                  </Title>
                </div>

                {!user && (
                  <Alert
                    type="info"
                    showIcon
                    message="Sign in before checkout"
                    description="We'll keep your place in the flow and return you here after login."
                  />
                )}

                {cancelledBookingId && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Checkout was cancelled"
                    description="Your selected seats remain reserved for a limited time. Resume the same secure checkout to keep them, or let the reservation expire."
                    action={(
                      <Button
                        size="small"
                        type="primary"
                        loading={resumingCheckout}
                        onClick={handleResumeCheckout}
                      >
                        Resume checkout
                      </Button>
                    )}
                  />
                )}

                <Card className="booking-summary-box" bordered={false}>
                  <Space direction="vertical" size={12} className="full-width">
                    <div className="summary-row">
                      <Text>Price per ticket</Text>
                      <Text strong>{formatCurrency(event.ticketPrice)}</Text>
                    </div>
                    <div className="summary-row booking-quantity-row">
                      <Text>Tickets</Text>
                      <InputNumber
                        min={1}
                        max={Math.max(1, availableTickets)}
                        value={quantity}
                        onChange={(value) => setQuantity(value || 1)}
                        disabled={availableTickets === 0}
                      />
                    </div>
                    <div className="summary-row">
                      <Text>Availability</Text>
                      <Text strong>{availableTickets} remaining</Text>
                    </div>
                    <div className="summary-row summary-row-start">
                      <Text>Selected seats</Text>
                      <Text strong>
                        {selectedSeats.length ? selectedSeats.join(', ') : 'Choose from map'}
                      </Text>
                    </div>
                    <Divider className="booking-divider" />
                    <div className="summary-row total-row">
                      <Text strong>Total</Text>
                      <Title level={3} className="booking-total">
                        {formatCurrency(totalPrice)}
                      </Title>
                    </div>
                  </Space>
                </Card>

                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleBooking}
                  loading={booking}
                  disabled={availableTickets === 0}
                  className="booking-action-button"
                  block
                >
                  {user
                    ? totalPrice > 0
                      ? 'Continue to secure checkout'
                      : 'Confirm free booking'
                    : 'Sign in to book'}
                </Button>

                <Text type="secondary" className="booking-trust-copy">
                  {totalPrice > 0
                    ? 'Payment is completed securely on Stripe Checkout. EventHub does not store your card details.'
                    : 'No payment is required for this event.'}
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card className="seat-layout-card" bordered={false}>
          <Space direction="vertical" size={20} className="full-width">
            <div className="seat-layout-header">
              <div>
                <Text className="booking-panel-label">Interactive seating</Text>
                <Title level={3} className="booking-panel-title">
                  Choose your seats
                </Title>
              </div>
              <div className="seat-layout-stats">
                <Tag color="green">{availableTickets} available</Tag>
                <Tag color="red">{seatLayout?.bookedSeats ?? 0} booked</Tag>
                <Tag color="gold">{selectedSeats.length} selected</Tag>
              </div>
            </div>

            <div className="seat-legend">
              <span className="seat-legend-item">
                <span className="seat-legend-chip seat-legend-chip-available" />
                Available
              </span>
              <span className="seat-legend-item">
                <span className="seat-legend-chip seat-legend-chip-selected" />
                Selected
              </span>
              <span className="seat-legend-item">
                <span className="seat-legend-chip seat-legend-chip-booked" />
                Booked
              </span>
            </div>

            {seatLayoutLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : !seatLayout?.seats?.length ? (
              <Empty description="Seat layout unavailable for this event" />
            ) : (
              <div className="seat-map-shell">
                <div className="stage-banner">Stage View</div>
                <div className="seat-grid-wrap">
                  {seatsByRow.map((rowBlock) => (
                    <div key={rowBlock.row} className="seat-row">
                      <span className="seat-row-label">
                        {rowBlock.seats[0]?.label?.replace(/\d+$/, '') || rowBlock.row}
                      </span>
                      <div className="seat-row-seats">
                        {rowBlock.seats.map((seat, index) => {
                          const isSelected = selectedSeats.includes(seat.label);
                          const isBooked = seat.status === 'BOOKED';
                          const seatClassName = [
                            'seat-tile',
                            isBooked ? 'seat-booked' : 'seat-available',
                            isSelected ? 'seat-selected' : '',
                            index === 3 ? 'seat-aisle-gap' : '',
                          ]
                            .filter(Boolean)
                            .join(' ');

                          return (
                            <button
                              key={seat.label}
                              type="button"
                              className={seatClassName}
                              onClick={() => toggleSeatSelection(seat)}
                              disabled={isBooked}
                              aria-pressed={isSelected}
                              aria-label={`${seat.label} ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                            >
                              {seat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="seat-selection-note">
                  <CheckCircleOutlined />
                  <span>Select {quantity} seat{quantity > 1 ? 's' : ''} to continue to payment.</span>
                </div>
              </div>
            )}
          </Space>
        </Card>

        <Row gutter={[24, 24]} className="review-section-row">
          <Col xs={24} lg={10}>
            <Card className="review-google-card" bordered={false}>
              <Space direction="vertical" size={12} className="full-width">
                <div className="google-review-head">
                  <Space>
                    <Text className="google-review-label">Attendee rating</Text>
                  </Space>
                  <Tag color="blue">{reviews.length} reviews</Tag>
                </div>
                <div className="google-review-score">
                  <Title level={2}>{eventAverageRating ? eventAverageRating.toFixed(1) : '0.0'}</Title>
                  <Rate allowHalf disabled value={eventAverageRating} />
                </div>
                <Text type="secondary">
                  Public visitors can read these reviews. Logged-in users can leave a review, and hosts can reply from the dashboard.
                </Text>
              </Space>
            </Card>

            <Card className="review-form-card" bordered={false}>
              <Space direction="vertical" size={16} className="full-width">
                <div>
                  <Text className="booking-panel-label">Share feedback</Text>
                  <Title level={3} className="booking-panel-title">Leave a review</Title>
                </div>
                {!user && (
                  <Alert
                    type="info"
                    showIcon
                    message="Sign in to leave a review"
                    description="Everyone can read reviews here, but only logged-in users can post one."
                  />
                )}
                <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
                  <Form.Item
                    name="rating"
                    label="Your rating"
                    rules={[{ required: true, message: 'Select a rating' }]}
                  >
                    <Rate />
                  </Form.Item>
                  <Form.Item
                    name="comment"
                    label="Your review"
                    rules={[{ required: true, message: 'Write a review comment' }]}
                  >
                    <Input.TextArea
                      rows={5}
                      placeholder="Tell others what stood out about this event."
                    />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={reviewSubmitting} block>
                    Submit review
                  </Button>
                </Form>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card className="review-list-card" bordered={false}>
              <Space direction="vertical" size={18} className="full-width">
                <div className="review-list-header">
                  <Title level={3}>Guest reviews</Title>
                  <Tag color="gold">{reviews.length} reviews</Tag>
                </div>

                {reviewLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : reviews.length === 0 ? (
                  <Empty description="No reviews yet" />
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className="single-review-card">
                      <Space direction="vertical" size={12} className="full-width">
                        <div className="review-meta-row">
                          <div>
                            <Text strong>{review.reviewerName}</Text>
                            <div>
                              <Text type="secondary">
                                {review.createdAt ? formatDate(review.createdAt) : 'Just now'}
                              </Text>
                            </div>
                          </div>
                          <Rate disabled value={review.rating} />
                        </div>
                        <Paragraph className="review-comment">{review.comment}</Paragraph>
                        {review.hostReply && (
                          <div className="host-reply-box">
                            <Text strong>Host reply</Text>
                            <Paragraph>{review.hostReply}</Paragraph>
                          </div>
                        )}
                      </Space>
                    </Card>
                  ))
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

    </div>
  );
};

export default EventDetails;
