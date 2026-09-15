# 🏍️ Okada Connect

### Connecting Okada Riders With Customers — Without Unnecessary Roaming

**Okada Connect** is a web-based motorcycle ride-request platform designed to help commercial motorcycle riders (okada riders) find customers without wasting fuel roaming around looking for passengers.

The platform connects **customers who need a ride** with **nearby available okada riders** using GPS/location services and map technology.

---

## 📌 The Problem

Many okada riders spend a significant amount of fuel and time moving around in search of customers.

At the same time, customers who need transportation may be standing nearby without knowing where an available rider is.

This creates a simple problem:

> **The rider is looking for a customer, while the customer is looking for a rider.**

Okada Connect aims to solve this problem by putting both sides on the same platform.

---

# 💡 The Solution

Okada Connect allows two types of users to use the platform:

### 🏍️ Okada Rider

A rider can:

* Create an account
* Sign in as an okada rider
* Create and manage a rider profile
* Set their availability status
* Share their current GPS location
* See nearby customer ride requests
* Accept a ride request
* View the customer's pickup location on a map
* Navigate toward the customer
* Mark a ride as completed

### 👤 Customer

A customer can:

* Create an account
* Sign in as a customer
* Allow the website to access their location
* Search/select a pickup location
* Request an okada ride
* See their pickup location on a map
* See available nearby riders
* Send a ride request
* Receive information about the rider
* Cancel a request
* Complete a ride

---

# 🗺️ Location & GPS System

Location is one of the most important parts of Okada Connect.

The application can use the browser's **Geolocation API** to obtain the user's current latitude and longitude.

Example:

```text
Customer
   ↓
Allow Location Access
   ↓
Browser obtains GPS coordinates
   ↓
Okada Connect receives:
latitude + longitude
   ↓
Location displayed on map
```

The application can then use a mapping service such as **Google Maps Platform** to display locations and help users search for places.

For example:

```text
Customer Location

Latitude: 6.5244
Longitude: 3.3792

        ↓

Google Map

        📍 Customer
        🏍️ Nearby Rider
```

The system should **not assume that GPS location is always perfectly accurate**. Customers should be able to confirm or adjust their pickup point on the map.

---

# 🚦 Basic Ride Request Flow

## Customer

```text
1. Customer opens Okada Connect
          ↓
2. Signs in as Customer
          ↓
3. Allows location access
          ↓
4. System detects current location
          ↓
5. Customer confirms pickup location
          ↓
6. Customer clicks "Request Rider"
          ↓
7. Nearby available riders are searched
          ↓
8. Request is sent to suitable rider(s)
          ↓
9. Rider accepts request
          ↓
10. Customer receives rider information
          ↓
11. Rider travels to pickup location
          ↓
12. Ride begins
          ↓
13. Ride completed
```

---

# 🏍️ Rider Flow

```text
1. Rider signs in
        ↓
2. Rider goes Online
        ↓
3. Rider shares current location
        ↓
4. System updates rider location
        ↓
5. Customer requests a ride nearby
        ↓
6. Rider receives request
        ↓
7. Rider accepts
        ↓
8. Rider sees customer's pickup location
        ↓
9. Rider travels to customer
        ↓
10. Ride starts
        ↓
11. Ride completed
        ↓
12. Rider becomes available again
```

---

# 🔎 Finding Nearby Riders

The backend should eventually calculate the distance between the customer and available riders.

For example:

```text
Customer
   📍
   |
   | 0.8 km
   |
   🏍️ Rider A

   | 2.4 km

   🏍️ Rider B
```

The system could prioritize riders based on:

1. Distance from customer
2. Rider availability
3. Rider status
4. Time since rider became available
5. Other business rules

For the MVP, we can start with a simple rule:

> **Find available riders within a specified radius of the customer.**

For example:

```text
Search radius: 3 km
```

---

# 📍 Map Features

The first version can include:

* Current user location
* Customer pickup marker
* Rider location marker
* Location search
* Map movement
* Pickup-location confirmation
* Distance calculation
* Route/navigation support

Possible Google Maps Platform services:

* Maps JavaScript API
* Places API
* Geocoding API
* Routes API

The exact APIs used can be decided during implementation.

---

# 🧠 MVP Architecture

A simple architecture can be:

```text
                OKADA CONNECT
                     │
        ┌────────────┴────────────┐
        │                         │
    CUSTOMER                   RIDER
        │                         │
        └────────────┬────────────┘
                     │
                 FRONTEND
                     │
                     ↓
                  API
                     │
          ┌──────────┴──────────┐
          │                     │
       Backend              Google Maps
          │                     │
          ↓                     ↓
      Database              Location/
                              Maps
```

---

# 🛠️ Suggested Technology Stack

For the first version:

## Frontend

* React
* JavaScript
* HTML
* CSS
* Tailwind CSS

## Backend

* Node.js
* Express.js

## Database

Start with:

* PostgreSQL

Alternative for early prototyping:

* MongoDB

## Authentication

* JWT authentication
* Password hashing with bcrypt

## Location

* Browser Geolocation API
* Google Maps Platform

## Real-Time Communication

For later versions:

* WebSockets
* Socket.IO

Real-time communication will eventually be important because rider locations and ride requests need to update without constantly refreshing the page.

---

# 📁 Suggested Project Structure

```text
okada_connect/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── README.md
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   ├── index.js
│   └── package.json
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

# 👥 User Roles

The system will have two primary roles.

## Customer

```text
role = customer
```

## Rider

```text
role = rider
```

A user account should contain information such as:

```text
User
├── id
├── name
├── phone
├── email
├── password
├── role
├── created_at
└── updated_at
```

---

# 🏍️ Rider Information

A rider profile could eventually contain:

```text
Rider
├── user_id
├── motorcycle_number
├── motorcycle_model
├── license_information
├── availability_status
├── current_latitude
├── current_longitude
├── rating
└── created_at
```

For the MVP, we should keep this simple and add verification features later.

---

# 🚕 Ride Request

A ride request could contain:

```text
RideRequest
├── id
├── customer_id
├── rider_id
├── pickup_latitude
├── pickup_longitude
├── pickup_address
├── status
├── requested_at
├── accepted_at
└── completed_at
```

Possible statuses:

```text
pending
accepted
arriving
in_progress
completed
cancelled
```

---

# 🔐 Authentication

Users should be able to choose:

```text
SIGN IN

[ Customer ]

[ Okada Rider ]
```

Registration should collect the appropriate information based on the selected role.

Example:

```text
Create Account

Full Name
Phone Number
Email
Password

I am registering as:

○ Customer
○ Okada Rider

[ Create Account ]
```

---

# 📱 Main Customer Dashboard

The customer dashboard could look approximately like:

```text
┌──────────────────────────────────────┐
│ 🏍️ OKADA CONNECT          Profile   │
├──────────────────────────────────────┤
│                                      │
│ Where do you want to go?             │
│                                      │
│ 📍 Current Location                  │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │            GOOGLE MAP            │ │
│ │                                  │ │
│ │        📍 Customer               │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Pickup Location                      │
│ [ Confirm Location ]                 │
│                                      │
│ [ REQUEST OKADA ]                    │
│                                      │
└──────────────────────────────────────┘
```

---

# 🏍️ Rider Dashboard

```text
┌──────────────────────────────────────┐
│ 🏍️ OKADA CONNECT          Profile   │
├──────────────────────────────────────┤
│                                      │
│ Rider Status                         │
│                                      │
│       🟢 ONLINE                      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │            MAP                   │ │
│ │                                  │ │
│ │             🏍️                  │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Nearby Requests                      │
│                                      │
│ Customer • 0.7 km away               │
│ [ VIEW REQUEST ]                     │
│                                      │
└──────────────────────────────────────┘
```

---

# 🔔 Ride Request

When a customer makes a request, nearby riders could receive:

```text
🚨 NEW RIDE REQUEST

Customer: John
Distance: 0.8 km

Pickup:
Ikeja, Lagos

[ ACCEPT ]     [ DECLINE ]
```

After acceptance:

```text
✅ RIDE ACCEPTED

Customer:
John

Pickup:
Ikeja, Lagos

Distance:
0.8 km

[ OPEN MAP ]
[ START RIDE ]
```

---

# 🔄 Real-Time Location

One of the most important future features is real-time rider location.

Instead of:

```text
Rider logs in
     ↓
Location saved once
     ↓
Nothing changes
```

we want:

```text
Rider
  🏍️
  ↓
GPS location
  ↓
Frontend
  ↓
WebSocket
  ↓
Backend
  ↓
Database / Location service
  ↓
Customer map
```

The customer could then see an available rider approaching their pickup location.

---

# 💰 Future Features

The MVP should focus on connecting riders and customers first.

After the core system works, we can add:

### Payments

* Cash
* Bank transfer
* Card
* Mobile payment

### Pricing

Automatic fare calculation based on:

* Distance
* Time
* Demand
* Location

### Ratings

Customers can rate riders.

```text
⭐ ⭐ ⭐ ⭐ ⭐
```

Riders could also rate customers.

### Notifications

* Ride request
* Ride accepted
* Rider arriving
* Ride completed
* Cancellation

### Rider Verification

Possible verification requirements:

* Phone verification
* Identity verification
* Driver/rider information
* Motorcycle information
* Required local permits/licensing

### Ride History

Customers:

```text
My Rides
├── Today
├── Yesterday
└── Previous rides
```

Riders:

```text
Ride History
├── Completed rides
├── Earnings
└── Customer ratings
```

---

# 🛡️ Safety

Safety should be treated as a core feature, not an afterthought.

Possible features include:

* Verified rider profiles
* Rider identification
* Emergency/SOS button
* Share ride details
* Ride tracking
* Customer/rider ratings
* Report user
* Block user
* Ride history
* Phone verification

The platform should also comply with applicable transportation, motorcycle, privacy, and data-protection requirements in the locations where it operates.

---

# 🔒 Privacy

Location data is sensitive.

The application should:

* Request permission before accessing GPS
* Explain why location is required
* Avoid collecting unnecessary location information
* Secure stored location data
* Stop unnecessary location tracking
* Restrict access to location information
* Provide appropriate privacy controls

A customer's exact location should not be publicly visible to every rider.

Only relevant riders should receive the information required to fulfil a ride request.

---

# 🎯 MVP Goal

The first version should **not attempt to build everything**.

The MVP should prove one important concept:

> **Can Okada Connect successfully connect a customer with a nearby available okada rider using their locations?**

### MVP Features

```text
✅ Customer registration
✅ Rider registration
✅ Customer login
✅ Rider login
✅ Role-based dashboards
✅ Customer GPS location
✅ Rider GPS location
✅ Map display
✅ Pickup location selection
✅ Nearby rider search
✅ Ride request
✅ Rider accepts request
✅ Customer sees accepted rider
✅ Ride status
✅ Ride completion
```

Leave these for later:

```text
⏳ Online payments
⏳ Advanced pricing
⏳ Ratings
⏳ SOS
⏳ Push notifications
⏳ Advanced rider verification
⏳ Real-time route tracking
⏳ Admin analytics
```

---

# 🚀 Development Roadmap

## Phase 1 — Project Setup

* Create Git repository
* Create frontend
* Create backend
* Configure environment variables
* Connect database
* Create basic README
* Set up Git workflow

## Phase 2 — Authentication

Build:

```text
Register
Login
Logout
Role selection
Protected routes
```

## Phase 3 — User Dashboards

Build separate dashboards for:

```text
Customer
Rider
```

## Phase 4 — Location

Implement:

```text
Browser GPS
      ↓
Latitude/Longitude
      ↓
Backend
      ↓
Database
```

## Phase 5 — Maps

Integrate Google Maps Platform.

Implement:

```text
Map
Current location
Location search
Pickup marker
```

## Phase 6 — Ride Requests

Implement:

```text
Customer
   ↓
Request ride
   ↓
Find nearby riders
   ↓
Rider receives request
   ↓
Accept / Decline
```

## Phase 7 — Ride Lifecycle

Implement:

```text
Pending
   ↓
Accepted
   ↓
Arriving
   ↓
In Progress
   ↓
Completed
```

## Phase 8 — Real-Time Features

Introduce:

* WebSockets/Socket.IO
* Live rider location
* Real-time ride status
* Notifications

## Phase 9 — Safety & Verification

Add:

* Rider verification
* Emergency features
* Reporting
* Ratings
* Privacy controls

## Phase 10 — Production

Before launching:

* Security review
* Database backups
* Error handling
* Logging
* Rate limiting
* Privacy policy
* Terms of service
* Location/transport regulatory review
* Production deployment

---

# 🌍 Long-Term Vision

Okada Connect can eventually become more than a simple ride-request website.

The long-term vision is:

> **A location-based transportation platform designed around the realities of motorcycle transportation in Nigerian cities.**

The platform could eventually support:

```text
Customers
    ↕
Okada Riders
    ↕
Local Businesses
    ↕
Delivery Services
    ↕
Transportation Network
```

This could expand beyond passenger transportation into motorcycle delivery and other location-based services.

---

# 🏁 Starting Principle

Do not build the entire application at once.

Build the smallest working version first:

```text
CUSTOMER
   ↓
Shares location
   ↓
Requests ride
   ↓
        OKADA CONNECT
              ↓
        Finds nearby rider
              ↓
            RIDER
              ↓
          Accepts
              ↓
        Customer + Rider
              ↓
             MAP
```

Once this basic flow works reliably, we can progressively add payments, real-time tracking, ratings, verification, notifications, and other features.

---

## Project Name

**Okada Connect**

### Possible Taglines

> **Find a Rider. Skip the Roaming.**

or

> **Your Ride. Nearby.**

or

> **Connecting Riders and Customers Smarter.**

---

## Status

🚧 **Project in Development**

The initial objective is to build and test the MVP before adding advanced transportation features.
