# Community Event Planner App 🎉

## Project Overview

The **Community Event Planner App** is a web-based application that allows users to create, view, edit, delete, and manage community events.
It helps communities organize activities such as workshops, meetups, cultural events, and social gatherings in an easy and interactive way.

The application uses **Firebase Authentication** for secure user login/signup and **Firebase Realtime Database** for real-time event data storage and retrieval.

---

## Features

* User registration and login (Firebase Authentication)
* Create, edit, and delete community events
* RSVP to events and view attendee lists
* Search events by title, description, or location
* Filter events by category (Social, Professional, Sports, Arts, Education, Other)
* Filter events by date (Upcoming, This Week, This Month)
* Event creator has exclusive edit/delete permissions
* Pre-defined event categories displayed on dashboard
* Real-time database updates
* Responsive and modern dark-themed UI
* Progressive Web App (PWA) support with offline caching

---

## Technologies Used

* HTML5
* CSS3
* JavaScript (ES6+)
* Firebase Authentication
* Firebase Realtime Database

Tools Used:

* Visual Studio Code
* Git & GitHub

---

## Project Structure

```
Community_event_planner_APP/
│
├── index.html           # Main dashboard page
├── login.html           # Login and Signup page
├── styles.css           # Dashboard styling
├── auth-styles.css      # Authentication page styling
├── app.js               # Event management logic (CRUD, RSVP, search, filter)
├── auth.js              # Firebase Authentication logic
├── service-worker.js    # PWA offline caching
├── manifest.json        # PWA configuration
├── project.json         # Project metadata
└── README.md            # Project documentation
```

---

## Firebase Configuration

This project uses **Firebase Authentication** and **Firebase Realtime Database**.

### Firebase Auth
* Email/Password sign-in method
* Secure user registration and login
* Session management handled by Firebase

### Firebase Realtime Database

Event data structure:

```json
{
  "events": {
    "eventId": {
      "title": "Music Festival",
      "category": "social",
      "date": "2026-03-20",
      "time": "18:00",
      "location": "City Park",
      "description": "Annual community music festival",
      "creator": "userId",
      "attendees": ["userId1", "userId2"]
    }
  },
  "users": {
    "userId": {
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": {
        "type": "initial",
        "initial": "J",
        "color": "#6366f1"
      },
      "createdAt": "2026-03-10T12:00:00Z"
    }
  }
}
```

---

## Installation and Setup

### Step 1: Clone the Repository

```
git clone https://github.com/YOUR_USERNAME/community-event-planner-app.git
```

### Step 2: Open the Project

Open the folder using **Visual Studio Code**.

File → Open Folder → Select project folder.

### Step 3: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Email/Password** sign-in method under Authentication → Sign-in method
4. Create a **Realtime Database** and set the rules
5. Copy your Firebase configuration and update the `firebaseConfig` object in `index.html` and `login.html`

### Step 4: Run the Application

Open **index.html** in a web browser
OR use the **Live Server extension** in Visual Studio Code.

Right Click → Open with Live Server

---

## Usage

1. Open the application in a browser
2. Register a new account or login with existing credentials
3. Browse event categories on the dashboard
4. Create a new event using the "+ Create Event" button
5. Click on any event to view details, RSVP, edit, or delete
6. Use search bar and filters to find specific events
7. Only the event creator can edit or delete their events

---

## Author

Harshith R S

---

## License

This project is created for educational and internship purposes.
