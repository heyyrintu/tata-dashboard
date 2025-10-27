# Dashboard Web Application

A professional dashboard web application that processes Excel files and displays analytics data with interactive visualizations.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose
- **Excel Processing**: xlsx library
- **Date Handling**: date-fns
- **File Upload**: Multer

## Project Structure

```
tata/
├── backend/          # Node.js/Express API
├── frontend/         # React dashboard
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tata-dashboard
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. The `.env` file is already created with `VITE_API_URL=http://localhost:5000/api`

4. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:5173`

## Usage

1. Start MongoDB on your local machine
2. Start the backend server (`npm run dev` in backend directory)
3. Start the frontend (`npm run dev` in frontend directory)
4. Open your browser to `http://localhost:5173`
5. Click "UPDATE EXCEL FILE" button in the header
6. Upload your Excel file (`.xlsx` or `.xls` format)
7. View the analytics with date range filtering

## API Endpoints

### POST /api/upload
Upload and process Excel file
- Accepts `.xlsx` or `.xls` files
- Returns record count and success message

### GET /api/analytics
Get analytics data with date range filtering
- Query params: `fromDate` (YYYY-MM-DD), `toDate` (YYYY-MM-DD)
- Returns: `totalTrips`, `totalIndents`, `dateRange`

## Features

- Excel file upload and parsing
- MongoDB data storage with all 23 columns
- Date range filtering
- Real-time analytics (Total Trips & Total Indents)
- Responsive design
- Professional UI with Tailwind CSS
- Error handling and loading states

## Phase 1 Deliverables

✓ Excel file upload and parsing  
✓ MongoDB data storage  
✓ Date range filtering  
✓ Two summary cards (Trips, Indents)  
✓ Clean, professional UI  
✓ Error handling  
✓ Responsive design  

## Future Phases

- User authentication
- Interactive graphs and charts
- Map visualization
- Advanced filtering options
- Export functionality

## License

ISC

