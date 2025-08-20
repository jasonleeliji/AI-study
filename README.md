# 悟空伴读 (AI-study-00)

This is a full-stack, commercial-grade application designed to help children focus on their homework. It uses an AI-powered vision model to monitor for distractions and provides real-time feedback.

## Project Architecture

The project is a monorepo with two main packages:

-   **`backend`**: A Node.js, Express, and TypeScript API that handles all business logic, database interactions, and communication with external services (AI model).
-   **`frontend`**: A React, Vite, and TypeScript single-page application that provides the user interface.

## Gamification: The Monkey King's Journey

To make learning more engaging, the application is built around a gamified narrative based on the classic story *Journey to the West*.

-   **The Story**: The AI plays the role of **Jin Chanzi** (Master Tang Sanzang's previous incarnation), who is in his ninth life searching for a worthy disciple to eventually accompany him on the Journey to the West. The child takes on the role of the protagonist, the **Stone Monkey**, who must train and prove their worth.
-   **Phase 1: Birth of the Stone Monkey**: The initial goal is to train focus. By completing a daily goal of 1 hour of focused study, the child "masters their skills" and becomes the Monkey King, unlocking a new "Water Curtain Cave" UI theme as a reward. This signifies they are ready to meet their master.
-   **Future Phases**: Subsequent features like homework correction will continue the story, mapping to different chapters of Wukong's journey after meeting his master.

## Tech Stack

**Backend:**
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Database**: sqlite
-   **Authentication**: JSON Web Tokens (JWT)
-   **AI Model**: Alibaba Qwen-VL-Plus
-   **Real-time**: WebSockets
-   **Core Dependencies**: `express`, `sqlite3`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `axios`, `ws`

**Frontend:**
-   **Framework**: React 18
-   **Bundler**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Routing**: React Router DOM
-   **State Management**: React Context API
-   **Core Dependencies**: `react`, `axios`, `react-router-dom`, `tailwindcss`

---

## Setup and Installation

### Prerequisites

-   Node.js (v18.x or later)
-   npm or yarn
-   sqlite instance (local)
-   Alibaba Cloud DashScope API Key (for Qwen model)

### 1. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd AI-study-00/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory by copying the example:
    ```bash
    cp .env.md .env
    ```
    Fill in the required values in your new `.env` file:
    -   `PORT`: The port for the backend server (e.g., 5000).
    -   `DB_PATH`: Your sqlite connection string.
    -   `JWT_SECRET`: A long, random string for signing tokens.
    -   `FRONTEND_URL`: The URL of the frontend app (e.g., `http://localhost:5173`).
    -   `QWEN_API_KEY`: Your API key for the Alibaba Qwen model.
    -   `QWEN_API_BASE_URL`: The DashScope API endpoint (e.g., `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The backend API will be running on the port specified in your `.env` file.

### 2. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd AI-study-00/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `frontend` directory by copying the example:
    ```bash
    cp .env.md .env
    ```
    Fill in the required values:
    -   `VITE_API_BASE_URL`: The full URL of your running backend server (e.g., `http://localhost:5000/api`).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## API Endpoints

The backend exposes a REST API for the frontend to consume. Key endpoints include:
-   `POST /api/auth/register`
-   `POST /api/auth/login`
-   `GET /api/user/profile`
-   `PUT /api/user/settings`
-   `POST /api/supervision/analyze`
-   `GET /api/reports/:period`
-   `POST /api/sessions/start`
-   `POST /api/sessions/stop`

See the backend source code under `src/routes` for a full list of endpoints.