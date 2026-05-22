# AgriMove – Low-Cost Smart Transport for Agricultural Produce

AgriMove is an AI-powered agricultural shipping platform designed for rural farmers in Tamil Nadu. The platform translates and extracts shipping parameters (crop type, volume, pickups, and market destinations) from native Tamil voice recordings or text, automatically clusters nearby farmer shipments heading to similar locations to split freight costs, and maps routes with simulated vehicle dispatch.

## 🚀 Key Features

* **Tamil Voice & Text NLP**: Farmers can record voice clips or type sentences in Tamil to extract crop type, weights, pickup locations, and market destinations.
* **Smart Cargo Grouping**: Consolidates separate shipments with matching destinations and source zones. Groups receive a **25% freight discount**, divided fairly based on volume weight.
* **Dynamic Route Visualizations**: High-tech custom maps displaying delivery routes, pickup clusters, and animated transit vehicles.
* **Role-Based Portals**: Tailored interfaces for Farmers, Drivers, and Admin managers.
* **Instant Demo Mode**: Access Farmer, Driver, or Admin views with a single click.
* **MongoDB Failover System**: Connects to MongoDB, with auto-failover to an in-memory JSON file store if MongoDB isn't running.

---

## ⚙️ Quick Start

### 1. Install Dependencies
Install frontend and backend packages:
```bash
npm install
npm install --prefix server
```

### 2. Run the Application
Start both servers concurrently:
```bash
npm run dev
```

* **Frontend Web App**: http://localhost:5173
* **Backend Express Server**: http://localhost:5000

---

## 📂 Configuration
To add a Google Gemini API Key for advanced colloquial Tamil parsing, create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrimove
JWT_SECRET=agrimove_super_secret_key
GEMINI_API_KEY=your_optional_gemini_api_key_here
```
