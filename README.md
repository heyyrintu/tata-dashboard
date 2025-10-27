# Drona Dashboard - Excel Analytics Platform

A modern, full-stack web application for processing and analyzing Excel trip data with real-time analytics and interactive visualizations.

## 🚀 Features

- **Excel File Upload**: Drag-and-drop interface for uploading `.xlsx` and `.xls` files
- **Data Processing**: Automatic parsing and storage of trip/indent data in MongoDB
- **Date Range Filtering**: Filter analytics by custom date ranges or select a specific month
- **Real-time Analytics**: Live display of total trips and indents
- **Dark Theme UI**: Sleek deep dark blue interface with glassmorphism effects
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Animated Interactions**: Smooth animations and hover effects throughout

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** with custom theming
- **Motion** (Framer Motion) for animations
- **React DatePicker** for date selection
- **Axios** for API communication
- **SheetJS (xlsx)** for Excel file handling

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose ODM
- **Multer** for file uploads
- **date-fns** for date manipulation

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v7 or higher)
- **npm** or **yarn**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tata-dashboard.git
cd tata-dashboard
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tata-dashboard
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
tata-dashboard/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── config/           # Configuration files
│   │   └── server.ts        # Entry point
│   ├── uploads/             # Excel file storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/         # Global state management
│   │   ├── services/        # API calls
│   │   ├── lib/            # Utilities
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   └── package.json
└── README.md
```

## 🔑 Key Features Explained

### Excel Data Processing
- Accepts `.xlsx` and `.xls` files
- Automatically parses all columns including dates
- Validates required fields (`Indent`, `Allocation Date`)
- Stores data in MongoDB with proper schema mapping

### Analytics Dashboard
- **Total Trips**: Count of records with valid allocation dates
- **Total Indents**: Count of unique indent values
- Real-time updates based on selected date range
- Month selector for quick filtering

### User Interface
- **Header**: Drona logo with glassmorphism effect
- **File Upload**: Drag-and-drop zone with file preview
- **Date Range Selector**: From/To date pickers with month selector
- **Summary Cards**: Animated metrics with gradient text
- **Background Effects**: Interactive ripple grid overlay

## 🎨 Design Features

- **Deep Dark Blue Theme** (#0a0e27) with glassmorphism
- **Gradient Accents**: Purple, cyan, and blue color schemes
- **Hover Effects**: Scale transforms and shadow animations
- **Smooth Transitions**: All interactions are animated
- **Custom Scrollbars**: Styled scrollbars matching the theme
- **Responsive Grid**: Adapts to all screen sizes

## 📝 Available Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon
npm run build    # Build for production
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🌐 API Endpoints

### POST `/api/upload`
Upload and process Excel files.

**Request**: Multipart form data with file
**Response**: 
```json
{
  "success": true,
  "recordCount": 12,
  "fileName": "MIS MASTER SHEET July 2025.xlsx",
  "message": "File processed successfully"
}
```

### GET `/api/analytics`
Get analytics data with optional date filtering.

**Query Parameters**:
- `fromDate` (optional): Start date (YYYY-MM-DD)
- `toDate` (optional): End date (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "totalTrips": 8,
  "totalIndents": 5,
  "dateRange": {
    "from": "2025-03-18",
    "to": "2025-03-25"
  },
  "recordsProcessed": 8
}
```

## 🗄️ Database Schema

The application uses MongoDB to store trip data:

```typescript
interface Trip {
  sNo: number;
  indentDate: Date;
  indent: string;           // Unique identifier
  allocationDate: Date;      // Primary filter field
  customerName: string;
  location: string;
  vehicleModel: string;
  vehicleNumber: string;
  // ... additional fields
}
```

## 🚧 Roadmap

- [ ] User authentication and authorization
- [ ] Advanced data visualization with charts
- [ ] Export functionality for filtered data
- [ ] Historical data comparison
- [ ] Real-time data updates
- [ ] Multi-user support with role-based access

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Drona Logitech Private Limited**

## 🙏 Acknowledgments

- [Aceternity UI](https://ui.aceternity.com) for design components
- [Motion](https://motion.dev) for animation library
- [React DatePicker](https://reactdatepicker.com) for date selection
