# Event Management System Frontend

A modern **Event Management System frontend** built with **React**, **Ant Design**, **React Router DOM**, **Axios**, **GSAP**, and **AOS**.

This frontend connects with the EMS Spring Boot backend and supports client event browsing, user registration, MFA login, event booking, seat selection, dummy payment checkout, host event management, admin approvals, booking history, reviews, cancellations, and refund workflows.

## Overview

The EMS Frontend is the client-side application for an Event Management System. It provides separate experiences for three main user roles:

* Clients / event attendees
* Hosts / event organisers
* Admin users

Clients can browse events, search by category or location, view event details, select seats, complete a dummy checkout, manage bookings, cancel bookings, and leave reviews.

Hosts can create and manage events, view bookings, monitor revenue, manage cancellations, process refunds, and reply to customer reviews.

Admins can approve or reject hosts, events, and users through a dedicated admin dashboard.

## Features

* Modern React frontend
* Client, host, and admin login flows
* MFA verification support
* Client registration
* Host registration
* Admin registration
* Role-based navigation
* Event browsing page
* Event search and category filtering
* Personalised event recommendations using local browser history
* Event detail page
* Interactive seat layout selection
* Ticket quantity selection
* Dummy payment checkout
* Booking confirmation page
* My Events page for user bookings
* Booking cancellation
* Refund processing updates
* Public event reviews
* User review submission
* Host reply to reviews
* Host dashboard
* Admin dashboard
* Event approval workflow
* Host approval workflow
* User moderation workflow
* Session expiry after 1 hour
* Responsive navigation drawer
* GSAP animations
* AOS scroll animations
* Ant Design UI components
* Backend API integration with Spring Boot

## Tech Stack

* React 19
* Create React App
* JavaScript
* Ant Design
* React Router DOM
* Axios
* GSAP
* AOS
* Moment.js
* React Icons
* Web Vitals
* CSS

## Project Structure

```bash
ems-front/
├── public/
│
├── src/
│   ├── assets/
│   │   └── logo.svg
│   │
│   ├── components/
│   │   ├── configs/
│   │   │   └── routePath.js
│   │   │
│   │   ├── footer/
│   │   │   └── footer.js
│   │   │
│   │   ├── header/
│   │   │   ├── header.js
│   │   │   └── Header.css
│   │   │
│   │   └── pages/
│   │       ├── admin-dashboard/
│   │       │   └── AdminDashboard.js
│   │       │
│   │       ├── admin-login/
│   │       │   └── AdminLogin.js
│   │       │
│   │       ├── admin-register/
│   │       │   └── AdminRegister.js
│   │       │
│   │       ├── booking-confirmation/
│   │       │   └── BookingConfirmation.js
│   │       │
│   │       ├── event-details/
│   │       │   └── eventdetails.js
│   │       │
│   │       ├── host-dashboard/
│   │       │   └── HostDashboard.js
│   │       │
│   │       ├── hostLogin/
│   │       │   └── hostLogin.js
│   │       │
│   │       ├── hostRegister/
│   │       │   └── hostRegister.js
│   │       │
│   │       ├── hostUpdateAccount/
│   │       │   └── hostUpdateAccount.js
│   │       │
│   │       ├── login/
│   │       │   └── logIn.js
│   │       │
│   │       ├── my-events/
│   │       │   └── MyEvents.js
│   │       │
│   │       ├── presentation/
│   │       │   └── presentation.js
│   │       │
│   │       ├── registration/
│   │       │   └── register.js
│   │       │
│   │       └── updateAccount/
│   │           └── updateAccount.js
│   │
│   ├── data/
│   │   ├── demoEvents.js
│   │   └── mockCards.json
│   │
│   ├── utils/
│   │   ├── authMessages.js
│   │   └── authSession.js
│   │
│   ├── App.js
│   ├── dark-theme.css
│   ├── index.js
│   └── reportWebVitals.js
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Main Pages

### Home / Presentation Page

The home page displays available events and allows users to search and filter events.

Main features:

* Browse all events
* Search by event title, category, location, or description
* Filter by category
* View recommended events
* View public reviews
* Pagination for event listings
* Fallback demo events when backend data is unavailable

### Event Details Page

The event details page allows users to view full event information and book tickets.

Main features:

* Event title, description, date, location, price, and category
* Available ticket count
* Interactive seat layout
* Seat selection
* Ticket quantity selection
* Dummy payment checkout
* Booking confirmation redirect
* Public event reviews
* User review submission
* Host replies displayed under reviews

### Client Login Page

The client login page supports password login followed by MFA verification.

Login flow:

```txt
Client enters email and password
        |
        v
Backend creates MFA challenge
        |
        v
Client enters verification code
        |
        v
User session is stored in localStorage
        |
        v
Client is redirected to the home page or previous event page
```

### Client Registration Page

The registration page allows clients to create an account.

Collected information includes:

* First name
* Last name
* Email
* Password
* Confirm password
* Phone number
* Gender
* Agreement confirmation

Password validation includes:

* Minimum 8 characters
* Uppercase letter
* Lowercase letter
* Number
* Special character

### My Events Page

The My Events page allows logged-in users to manage their bookings.

Main features:

* View booked events
* View booking reference
* View ticket quantity
* View total amount
* View event status
* View refund status
* Cancel confirmed bookings
* View cancellation and refund updates

### Host Login Page

The host login page supports host authentication with MFA verification.

After successful login, hosts are redirected to the host dashboard.

### Host Dashboard

The host dashboard gives event organisers a complete event management workspace.

Main features:

* Host overview statistics
* Active event count
* Total booking count
* Revenue tracking
* Available seat count
* Review count
* Create new event
* Edit event
* Cancel event
* View bookings
* View pending refunds
* Mark refunds as completed
* View reviews
* Reply to customer reviews
* Mobile-friendly dashboard drawer

### Admin Login Page

The admin login page supports admin authentication with MFA verification.

After successful login, admins are redirected to the admin dashboard.

### Admin Dashboard

The admin dashboard allows platform administrators to manage approvals and moderation.

Main features:

* View platform statistics
* Approve users
* Reject users
* Approve hosts
* Reject hosts
* Approve events
* Reject events
* Moderate platform activity from one dashboard

### Booking Confirmation Page

After a successful dummy checkout, the user is redirected to the booking confirmation page.

Displayed information includes:

* Booking status
* Event title
* Booking reference
* Event date
* Location
* Customer name
* Customer email
* Dummy payment card
* Selected seats
* Booking date
* Ticket price
* Quantity
* Remaining tickets
* Total charged

## Role-Based Navigation

The header changes based on the logged-in user type.

### Guest

Guests can:

* Browse events
* Search events
* View event details
* Open login modal
* Choose client, host, or admin login

### Client

Clients can:

* Browse events
* Book events
* View My Events
* Update account
* Logout

### Host

Hosts can:

* Access host dashboard
* Create and manage events
* Update host account
* Logout

### Admin

Admins can:

* Access admin dashboard
* Manage approvals
* Logout

## Authentication and Session Handling

The frontend stores authenticated user data in browser localStorage.

Storage keys used:

```txt
user
host
admin
loggedIn
redirectAfterLogin
```

The application includes an auth session guard that expires active sessions after 1 hour.

When the session expires:

* Stored login data is cleared
* The user is redirected to the home page
* A session expiry message is displayed

## Backend API Integration

The frontend is configured to communicate with the Spring Boot backend at:

```txt
http://localhost:8080
```

Main backend API areas:

| Feature             | API Base               |
| ------------------- | ---------------------- |
| Client login        | `/api/login`           |
| Client registration | `/api/users/register`  |
| Host login          | `/api/hosts/login`     |
| Host registration   | `/api/hosts/register`  |
| Admin login         | `/api/admin/login`     |
| Events              | `/api/events`          |
| Bookings            | `/api/bookings`        |
| Reviews             | `/api/reviews`         |
| Host dashboard      | `/api/host-dashboard`  |
| Admin dashboard     | `/api/admin/dashboard` |

## Routes

| Route                   | Description                    |
| ----------------------- | ------------------------------ |
| `/`                     | Home event discovery page      |
| `/login`                | Client login                   |
| `/register`             | Client registration            |
| `/update-account`       | Client account update          |
| `/host-login`           | Host login                     |
| `/host-register`        | Host registration              |
| `/host-update`          | Host account update            |
| `/event/:id`            | Event details and booking page |
| `/my-events`            | User booking history           |
| `/booking-confirmation` | Booking confirmation page      |
| `/dashboard`            | Host dashboard                 |
| `/admin-login`          | Admin login                    |
| `/admin-register`       | Admin registration             |
| `/admin-dashboard`      | Admin dashboard                |

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/DANUCKSAN/ems-front.git
```

### 2. Navigate to the project folder

```bash
cd ems-front
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the backend

Make sure the EMS Spring Boot backend is running on:

```txt
http://localhost:8080
```

### 5. Start the frontend

```bash
npm start
```

The frontend will run locally at:

```txt
http://localhost:3000
```

## Available Scripts

### Start development server

```bash
npm start
```

Runs the app in development mode.

### Run tests

```bash
npm test
```

Launches the test runner.

### Build for production

```bash
npm run build
```

Builds the app for production into the `build` folder.

### Eject Create React App configuration

```bash
npm run eject
```

This is a one-way operation and is not recommended unless full configuration control is required.

## Dummy Payment System

The application includes a dummy checkout flow for development and demonstration purposes.

Users select a sample card and enter the matching CVV to complete the booking.

This is not a real payment gateway.

For production, replace the dummy checkout with a real payment provider such as:

* Stripe
* PayPal
* Square
* Braintree

## Review System

The application supports public reviews for events.

Users can:

* View public event reviews
* Submit a rating
* Submit review comments

Hosts can:

* View reviews for their events
* Reply to customer reviews
* Edit existing replies

## Seat Booking System

The event details page includes an interactive seat selection layout.

Seat states include:

* Available
* Selected
* Booked

Users must select the same number of seats as their ticket quantity before continuing to checkout.

## Admin Approval Workflow

Admins can review and update approval status for:

* Users
* Hosts
* Events

Supported approval statuses:

```txt
PENDING
APPROVED
REJECTED
```

## Host Event Workflow

```txt
Host logs in
        |
        v
Host creates event
        |
        v
Event is submitted for admin review
        |
        v
Admin approves or rejects event
        |
        v
Approved event appears for users
        |
        v
Users book tickets
        |
        v
Host monitors bookings and revenue
```

## Client Booking Workflow

```txt
Client browses events
        |
        v
Client opens event details
        |
        v
Client selects quantity and seats
        |
        v
Client completes dummy checkout
        |
        v
Booking confirmation is generated
        |
        v
Booking appears under My Events
```

## Cancellation and Refund Workflow

```txt
User or host cancels booking/event
        |
        v
Booking status changes to cancelled
        |
        v
Refund status becomes pending
        |
        v
Host reviews pending refunds
        |
        v
Host marks refund as completed
```

## UI and Design Highlights

* Clean event discovery interface
* Responsive navigation header
* Mobile drawer navigation
* Ant Design form components
* Dashboard statistic cards
* Tables for admin and host management
* Interactive event cards
* Animated sections using GSAP
* Scroll animations using AOS
* Dark theme styling
* Google-style review display
* Professional event booking layout

## Learning Outcomes

This project demonstrates practical frontend development skills including:

* Building a React single-page application
* Managing routing with React Router
* Creating role-based UI experiences
* Integrating frontend with Spring Boot REST APIs
* Handling authentication and MFA flows
* Managing localStorage sessions
* Building admin and host dashboards
* Creating booking and checkout flows
* Implementing interactive seat selection
* Using Ant Design components
* Adding animations with GSAP and AOS
* Handling API errors and fallback data
* Building responsive frontend layouts

## Future Improvements

* Move backend base URL into environment variables
* Add protected route components
* Add JWT-based frontend authentication
* Add refresh token support
* Add Redux Toolkit or Zustand for global state
* Add real payment gateway integration
* Add real-time booking updates
* Add email notifications UI
* Add event image upload from host dashboard
* Add advanced event filters
* Add sorting by date, price, and location
* Add loading skeletons across all pages
* Add accessibility improvements
* Add unit and integration tests
* Add CI/CD workflow using GitHub Actions
* Deploy frontend to Vercel or Netlify

## Repository Description

Event Management System frontend built with React, Ant Design, React Router, GSAP, client/host/admin login, MFA verification, event booking, dashboards, reviews, and refunds.

## Topics

```txt
react
react19
create-react-app
javascript
antd
ant-design
react-router
axios
gsap
aos
event-management-system
ems
event-booking
ticket-booking
seat-booking
admin-dashboard
host-dashboard
mfa
frontend
responsive-design
```

## Author

**Danucksan Sathiyaraj**

GitHub: DANUCKSAN

## License

This project is open-source and available for learning, portfolio, and demonstration purposes.
