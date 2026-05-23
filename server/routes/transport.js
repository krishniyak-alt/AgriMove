import express from "express";
import { parseTamilProduceRequest } from "../nlp.js";
import { TransportRequest, RequestGroup, User, useMock, mockStore, saveMockData } from "../db.js";

const router = express.Router();

// District/city coordinates lookup for Tamil Nadu
const LOCATION_COORDS = {
  "thanjavur": { lat: 10.7870, lng: 79.1378 },
  "tanjore": { lat: 10.7870, lng: 79.1378 },
  "thanjai": { lat: 10.7870, lng: 79.1378 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "madurai": { lat: 9.9252, lng: 78.1198 },
  "trichy": { lat: 10.7905, lng: 78.7047 },
  "tiruchirappalli": { lat: 10.7905, lng: 78.7047 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "kovai": { lat: 11.0168, lng: 76.9558 },
  "salem": { lat: 11.6643, lng: 78.1460 },
  "tirunelveli": { lat: 8.7139, lng: 77.7567 },
  "nellai": { lat: 8.7139, lng: 77.7567 },
  "erode": { lat: 11.3410, lng: 77.7172 },
  "vellore": { lat: 12.9165, lng: 79.1325 },
  "tuticorin": { lat: 8.7642, lng: 78.1348 },
  "kanyakumari": { lat: 8.0883, lng: 77.5385 },
  "kumbakonam": { lat: 10.9602, lng: 79.3845 },
  "koyambedu": { lat: 13.0732, lng: 80.2012 },
  "market": { lat: 13.0732, lng: 80.2012 },
  "oddanchatram": { lat: 10.4856, lng: 77.7471 },
  "tiruppur": { lat: 11.1085, lng: 77.3411 },
  "dharmapuri": { lat: 12.1275, lng: 78.1582 },
  "cuddalore": { lat: 11.7480, lng: 79.7714 },
  "dindigul": { lat: 10.3673, lng: 77.9803 },
  "kanchipuram": { lat: 12.8342, lng: 79.7036 },
  "karur": { lat: 10.9601, lng: 78.0766 },
  "krishnagiri": { lat: 12.5186, lng: 78.2137 },
  "nagapattinam": { lat: 10.7672, lng: 79.8444 },
  "namakkal": { lat: 11.2189, lng: 78.1672 },
  "nilgiris": { lat: 11.4166, lng: 76.6950 },
  "ooty": { lat: 11.4166, lng: 76.6950 },
  "perambalur": { lat: 11.2342, lng: 78.8820 },
  "pudukkottai": { lat: 10.3833, lng: 78.8222 },
  "ramanathapuram": { lat: 9.3639, lng: 78.8395 },
  "sivaganga": { lat: 9.8433, lng: 78.4809 },
  "theni": { lat: 10.0104, lng: 77.4777 },
  "tirupathur": { lat: 12.4934, lng: 78.5678 },
  "tiruvallur": { lat: 13.1388, lng: 79.9079 },
  "tiruvannamalai": { lat: 12.2274, lng: 79.0747 },
  "tiruvarur": { lat: 10.7719, lng: 79.6384 },
  "viluppuram": { lat: 11.9401, lng: 79.4950 },
  "virudhunagar": { lat: 9.5872, lng: 77.9514 },
  "tenkasi": { lat: 8.9591, lng: 77.3139 },
  "ranipet": { lat: 12.9272, lng: 79.3328 },
  "kallakurichi": { lat: 11.7381, lng: 78.9622 },
  "chengalpattu": { lat: 12.6841, lng: 79.9836 },
  "mayiladuthurai": { lat: 11.1018, lng: 79.6522 },
  "ariyalur": { lat: 11.1401, lng: 79.0786 },
  "arakkonam": { lat: 13.0827, lng: 79.6670 }
};

function getCoordsForLocation(locName) {
  const clean = locName.toLowerCase().trim();
  if (LOCATION_COORDS[clean]) {
    return LOCATION_COORDS[clean];
  }
  // Search partial matches
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }
  // Default to Thanjavur (central agricultural area) with small jitter
  return {
    lat: 10.7870 + (Math.random() - 0.5) * 0.15,
    lng: 79.1378 + (Math.random() - 0.5) * 0.15
  };
}

// Haversine Distance Formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Cost Calculator Helper
function calculateTransportCost(distance, quantityKg) {
  const baseFare = 400; // Rs. 400 base
  const distFare = distance * 10; // Rs. 10/km
  const weightFare = quantityKg * 1.5; // Rs. 1.5/kg
  return Math.round(baseFare + distFare + weightFare);
}

// 1. POST: NLP Parsing of Tamil Text/Voice transcription
router.post("/parse-nlp", async (req, res) => {
  try {
    const { text, apiKey } = req.body;
    console.log("NLP Text received on server:", JSON.stringify(text));
    if (!text) {
      return res.status(400).json({ error: "No text provided for analysis" });
    }

    const nlpData = await parseTamilProduceRequest(text, apiKey);
    console.log("NLP Parsed output:", JSON.stringify(nlpData));

    // Get Coordinates
    const pickupCoords = getCoordsForLocation(nlpData.sourceEnglish);
    const destCoords = getCoordsForLocation(nlpData.destinationEnglish);

    // Estimate Distance and Cost
    const distance = getDistance(pickupCoords.lat, pickupCoords.lng, destCoords.lat, destCoords.lng);
    const estimatedPrice = calculateTransportCost(distance, nlpData.quantity);

    res.json({
      success: true,
      text,
      parsed: {
        crop: nlpData.cropEnglish,
        cropTamil: nlpData.cropTamil,
        source: nlpData.sourceEnglish,
        sourceTamil: nlpData.sourceTamil,
        destination: nlpData.destinationEnglish,
        destinationTamil: nlpData.destinationTamil,
        quantity: nlpData.quantity,
        quantityUnit: nlpData.quantityUnit,
        pickupCoords,
        destinationCoords: destCoords,
        distance: Math.round(distance * 10) / 10,
        estimatedPrice,
        parsedMethod: nlpData.parsedMethod
      }
    });
  } catch (err) {
    console.error("NLP route error:", err);
    res.status(500).json({ error: "Error parsing text" });
  }
});

// 2. POST: Submit a new Transport Request
router.post("/request", async (req, res) => {
  try {
    const {
      farmerId,
      cropType,
      quantity,
      pickupLocation,
      pickupCoords,
      destinationLocation,
      destinationCoords,
      date,
      price,
      voiceUrl
    } = req.body;

    if (!farmerId || !cropType || !quantity || !pickupLocation || !destinationLocation || !date) {
      return res.status(400).json({ error: "Missing required request fields" });
    }

    // Default coords if not supplied
    const finalPickupCoords = pickupCoords || getCoordsForLocation(pickupLocation);
    const finalDestCoords = destinationCoords || getCoordsForLocation(destinationLocation);

    // Calculate final distance and price
    const distance = getDistance(finalPickupCoords.lat, finalPickupCoords.lng, finalDestCoords.lat, finalDestCoords.lng);
    const finalPrice = price || calculateTransportCost(distance, quantity);

    if (useMock()) {
      const newRequest = {
        _id: "req_" + Math.random().toString(36).substr(2, 9),
        farmer: farmerId,
        cropType,
        quantity: Number(quantity),
        pickupLocation,
        pickupCoords: finalPickupCoords,
        destinationLocation,
        destinationCoords: finalDestCoords,
        date,
        price: finalPrice,
        status: "pending",
        voiceUrl: voiceUrl || "",
        createdAt: new Date().toISOString()
      };

      mockStore.requests.push(newRequest);
      saveMockData();

      // Trigger automatic grouping check after adding request
      await autoGroupRequest(newRequest);

      return res.status(201).json({
        success: true,
        message: "Transport request submitted (local store)",
        request: newRequest
      });
    } else {
      const newRequest = new TransportRequest({
        farmer: farmerId,
        cropType,
        quantity: Number(quantity),
        pickupLocation,
        pickupCoords: finalPickupCoords,
        destinationLocation,
        destinationCoords: finalDestCoords,
        date,
        price: finalPrice,
        voiceUrl: voiceUrl || ""
      });

      await newRequest.save();

      // Trigger automatic grouping
      await autoGroupRequest(newRequest);

      res.status(201).json({
        success: true,
        message: "Transport request submitted successfully",
        request: newRequest
      });
    }
  } catch (err) {
    console.error("Submit request error:", err);
    res.status(500).json({ error: "Server request submission error" });
  }
});

// 3. GET: Fetch farmer's own requests
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;

    if (useMock()) {
      const requests = mockStore.requests.filter(r => r.farmer === farmerId);
      // Hydrate farmer and driver details mock-style
      const hydrated = requests.map(r => {
        const farmerUser = mockStore.users.find(u => u.id === r.farmer || u._id === r.farmer);
        const driverUser = r.driver ? mockStore.users.find(u => u.id === r.driver || u._id === r.driver) : null;
        const groupObj = r.group ? mockStore.groups.find(g => g._id === r.group || g.id === r.group) : null;
        return {
          ...r,
          farmer: farmerUser ? { name: farmerUser.name, phone: farmerUser.phone } : null,
          driver: driverUser ? { name: driverUser.name, phone: driverUser.phone, vehicleNumber: driverUser.vehicleNumber } : null,
          group: groupObj
        };
      });
      return res.json(hydrated);
    } else {
      const requests = await TransportRequest.find({ farmer: farmerId })
        .populate("driver", "name phone vehicleNumber")
        .populate("group")
        .sort({ createdAt: -1 });
      res.json(requests);
    }
  } catch (err) {
    console.error("Get farmer requests error:", err);
    res.status(500).json({ error: "Server fetching error" });
  }
});

// 4. GET: Driver Jobs (available ones that are pending or grouped pending driver assignment)
router.get("/driver/available-jobs", async (req, res) => {
  try {
    if (useMock()) {
      // Find requests not in groups and still pending, plus groups that are pending
      const singleRequests = mockStore.requests.filter(r => r.status === "pending" && !r.group);
      const groups = mockStore.groups.filter(g => g.status === "pending" && !g.driver);

      // Hydrate
      const hydratedRequests = singleRequests.map(r => {
        const farmerUser = mockStore.users.find(u => u.id === r.farmer || u._id === r.farmer);
        return { ...r, type: "single", farmer: farmerUser ? { name: farmerUser.name, phone: farmerUser.phone } : null };
      });

      const hydratedGroups = groups.map(g => {
        const populatedReqs = g.requests.map(reqId => {
          const reqItem = mockStore.requests.find(r => r._id === reqId || r.id === reqId);
          const farmerUser = reqItem ? mockStore.users.find(u => u.id === reqItem.farmer || u._id === reqItem.farmer) : null;
          return reqItem ? { ...reqItem, farmer: farmerUser ? { name: farmerUser.name, phone: farmerUser.phone } : null } : null;
        }).filter(Boolean);

        return { ...g, type: "group", requests: populatedReqs };
      });

      res.json({
        singles: hydratedRequests,
        groups: hydratedGroups
      });
    } else {
      // MongoDB
      const singleRequests = await TransportRequest.find({ status: "pending", group: { $exists: false } })
        .populate("farmer", "name phone");

      const groups = await RequestGroup.find({ status: "pending", driver: { $exists: false } })
        .populate({
          path: "requests",
          populate: { path: "farmer", select: "name phone" }
        });

      res.json({
        singles: singleRequests,
        groups: groups
      });
    }
  } catch (err) {
    console.error("Get available jobs error:", err);
    res.status(500).json({ error: "Server fetching error" });
  }
});

// 5. POST: Accept Job (either group or single request)
router.post("/driver/accept-job", async (req, res) => {
  try {
    const { driverId, jobId, jobType } = req.body;

    if (!driverId || !jobId) {
      return res.status(400).json({ error: "Driver ID and Job ID required" });
    }

    if (useMock()) {
      const driver = mockStore.users.find(u => u.id === driverId || u._id === driverId);
      if (!driver) return res.status(404).json({ error: "Driver not found" });

      if (jobType === "group") {
        const groupIndex = mockStore.groups.findIndex(g => g._id === jobId || g.id === jobId);
        if (groupIndex === -1) return res.status(404).json({ error: "Group not found" });

        mockStore.groups[groupIndex].driver = driverId;
        mockStore.groups[groupIndex].status = "assigned";

        // Update all requests in group
        const reqIds = mockStore.groups[groupIndex].requests;
        mockStore.requests.forEach((r, idx) => {
          if (reqIds.includes(r.id) || reqIds.includes(r._id)) {
            mockStore.requests[idx].status = "assigned";
            mockStore.requests[idx].driver = driverId;
          }
        });
      } else {
        const reqIndex = mockStore.requests.findIndex(r => r._id === jobId || r.id === jobId);
        if (reqIndex === -1) return res.status(404).json({ error: "Request not found" });

        mockStore.requests[reqIndex].driver = driverId;
        mockStore.requests[reqIndex].status = "assigned";
      }

      saveMockData();
      return res.json({ success: true, message: "Job accepted successfully" });
    } else {
      // MongoDB
      const driver = await User.findById(driverId);
      if (!driver) return res.status(404).json({ error: "Driver not found" });

      if (jobType === "group") {
        const group = await RequestGroup.findByIdAndUpdate(jobId, {
          driver: driverId,
          status: "assigned"
        }, { new: true });

        await TransportRequest.updateMany(
          { _id: { $in: group.requests } },
          { driver: driverId, status: "assigned" }
        );
      } else {
        await TransportRequest.findByIdAndUpdate(jobId, {
          driver: driverId,
          status: "assigned"
        });
      }

      res.json({ success: true, message: "Job accepted successfully" });
    }
  } catch (err) {
    console.error("Accept job error:", err);
    res.status(500).json({ error: "Server accepting job error" });
  }
});

// 6. POST: Driver updating trip status
router.post("/driver/update-status", async (req, res) => {
  try {
    const { jobId, jobType, status } = req.body; // status: 'in_transit', 'delivered'

    if (useMock()) {
      if (jobType === "group") {
        const groupIdx = mockStore.groups.findIndex(g => g._id === jobId || g.id === jobId);
        if (groupIdx !== -1) {
          mockStore.groups[groupIdx].status = status;
          const reqIds = mockStore.groups[groupIdx].requests;
          mockStore.requests.forEach((r, idx) => {
            if (reqIds.includes(r.id) || reqIds.includes(r._id)) {
              mockStore.requests[idx].status = status;
            }
          });
        }
      } else {
        const reqIdx = mockStore.requests.findIndex(r => r._id === jobId || r.id === jobId);
        if (reqIdx !== -1) {
          mockStore.requests[reqIdx].status = status;
        }
      }
      saveMockData();
      return res.json({ success: true, message: `Status updated to ${status}` });
    } else {
      if (jobType === "group") {
        const group = await RequestGroup.findByIdAndUpdate(jobId, { status }, { new: true });
        await TransportRequest.updateMany(
          { _id: { $in: group.requests } },
          { status }
        );
      } else {
        await TransportRequest.findByIdAndUpdate(jobId, { status });
      }
      res.json({ success: true, message: `Status updated to ${status}` });
    }
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Error updating status" });
  }
});

// 7. GET: Driver active jobs / trips
router.get("/driver/active-jobs/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    if (useMock()) {
      const activeSingles = mockStore.requests.filter(r => r.driver === driverId && ["assigned", "in_transit"].includes(r.status));
      const activeGroups = mockStore.groups.filter(g => g.driver === driverId && ["assigned", "in_transit"].includes(g.status));

      const hydratedRequests = activeSingles.map(r => {
        const farmerUser = mockStore.users.find(u => u.id === r.farmer || u._id === r.farmer);
        return { ...r, type: "single", farmer: farmerUser ? { name: farmerUser.name, phone: farmerUser.phone } : null };
      });

      const hydratedGroups = activeGroups.map(g => {
        const populatedReqs = g.requests.map(reqId => {
          const reqItem = mockStore.requests.find(r => r._id === reqId || r.id === reqId);
          const farmerUser = reqItem ? mockStore.users.find(u => u.id === reqItem.farmer || u._id === reqItem.farmer) : null;
          return reqItem ? { ...reqItem, farmer: farmerUser ? { name: farmerUser.name, phone: farmerUser.phone } : null } : null;
        }).filter(Boolean);

        return { ...g, type: "group", requests: populatedReqs };
      });

      res.json({
        singles: hydratedRequests,
        groups: hydratedGroups
      });
    } else {
      const singles = await TransportRequest.find({
        driver: driverId,
        status: { $in: ["assigned", "in_transit"] }
      }).populate("farmer", "name phone");

      const groups = await RequestGroup.find({
        driver: driverId,
        status: { $in: ["assigned", "in_transit"] }
      }).populate({
        path: "requests",
        populate: { path: "farmer", select: "name phone" }
      });

      res.json({ singles, groups });
    }
  } catch (err) {
    console.error("Get driver active jobs error:", err);
    res.status(500).json({ error: "Server error fetching active trips" });
  }
});

// 8. GET: Driver Earnings dashboard data
router.get("/driver/earnings/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    if (useMock()) {
      const completedSingles = mockStore.requests.filter(r => r.driver === driverId && r.status === "delivered");
      const completedGroups = mockStore.groups.filter(g => g.driver === driverId && g.status === "delivered");

      const singleEarnings = completedSingles.reduce((sum, r) => sum + r.price, 0);
      const groupEarnings = completedGroups.reduce((sum, g) => sum + g.totalPrice, 0);

      const tripsCount = completedSingles.length + completedGroups.length;

      return res.json({
        totalEarnings: singleEarnings + groupEarnings,
        tripsCompleted: tripsCount,
        recentTrips: [...completedSingles.map(s => ({ ...s, type: "single" })), ...completedGroups.map(g => ({ ...g, type: "group" }))]
      });
    } else {
      const completedSingles = await TransportRequest.find({ driver: driverId, status: "delivered" });
      const completedGroups = await RequestGroup.find({ driver: driverId, status: "delivered" });

      const singleEarnings = completedSingles.reduce((sum, r) => sum + r.price, 0);
      const groupEarnings = completedGroups.reduce((sum, g) => sum + g.totalPrice, 0);

      res.json({
        totalEarnings: singleEarnings + groupEarnings,
        tripsCompleted: completedSingles.length + completedGroups.length,
        recentTrips: [...completedSingles.map(s => ({ ...s.toObject(), type: "single" })), ...completedGroups.map(g => ({ ...g.toObject(), type: "group" }))]
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Earnings error" });
  }
});

// 9. GET: Detect nearby farmers requesting transport for cost sharing recommendation
router.get("/nearby-farmers", async (req, res) => {
  try {
    const { lat, lng, excludeId } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (useMock()) {
      // Find pending requests within 30km
      const nearby = mockStore.requests.filter(r => {
        if (r.status !== "pending" || r.group) return false;
        if (r.id === excludeId || r._id === excludeId) return false;
        const dist = getDistance(latitude, longitude, r.pickupCoords.lat, r.pickupCoords.lng);
        return dist <= 30; // 30 km radius
      });

      // Hydrate farmer details
      const hydrated = nearby.map(r => {
        const farmer = mockStore.users.find(u => u.id === r.farmer || u._id === r.farmer);
        const dist = getDistance(latitude, longitude, r.pickupCoords.lat, r.pickupCoords.lng);
        return {
          id: r._id || r.id,
          farmerName: farmer ? farmer.name : "Farmer",
          pickupLocation: r.pickupLocation,
          cropType: r.cropType,
          quantity: r.quantity,
          price: r.price,
          distanceKm: Math.round(dist * 10) / 10,
          potentialSavings: Math.round(r.price * 0.35) // estimate 35% savings
        };
      });

      return res.json(hydrated);
    } else {
      // MongoDB Flow: fetch all pending and filter in JS due to complex geo-lookup on coords
      const allPending = await TransportRequest.find({ status: "pending", group: { $exists: false } })
        .populate("farmer", "name");

      const nearby = allPending.filter(r => {
        if (r._id.toString() === excludeId) return false;
        const dist = getDistance(latitude, longitude, r.pickupCoords.lat, r.pickupCoords.lng);
        return dist <= 30;
      }).map(r => {
        const dist = getDistance(latitude, longitude, r.pickupCoords.lat, r.pickupCoords.lng);
        return {
          id: r._id,
          farmerName: r.farmer ? r.farmer.name : "Farmer",
          pickupLocation: r.pickupLocation,
          cropType: r.cropType,
          quantity: r.quantity,
          price: r.price,
          distanceKm: Math.round(dist * 10) / 10,
          potentialSavings: Math.round(r.price * 0.35)
        };
      });

      res.json(nearby);
    }
  } catch (err) {
    console.error("Nearby farmers error:", err);
    res.status(500).json({ error: "Server error finding nearby requests" });
  }
});

// GET: All bookings for Admin Panel
router.get("/admin/analytics", async (req, res) => {
  try {
    if (useMock()) {
      const totalRequests = mockStore.requests.length;
      const completedRequests = mockStore.requests.filter(r => r.status === "delivered").length;
      const activeRequests = mockStore.requests.filter(r => ["assigned", "in_transit"].includes(r.status)).length;
      const pendingRequests = mockStore.requests.filter(r => r.status === "pending").length;

      const totalFarmers = mockStore.users.filter(u => u.role === "farmer").length;
      const totalDrivers = mockStore.users.filter(u => u.role === "driver").length;

      // Grouped percentage
      const groupedCount = mockStore.requests.filter(r => r.group).length;
      const groupingEfficiency = totalRequests > 0 ? Math.round((groupedCount / totalRequests) * 100) : 0;

      // Estimated total volume in tons
      const totalVolumeKg = mockStore.requests.reduce((sum, r) => sum + r.quantity, 0);
      const totalVolumeTons = Math.round((totalVolumeKg / 1000) * 10) / 10;

      // Calculate total savings generated (35% on grouped requests)
      const groupSavings = mockStore.requests
        .filter(r => r.group)
        .reduce((sum, r) => sum + (r.price * 0.35), 0);

      res.json({
        totalRequests,
        completedRequests,
        activeRequests,
        pendingRequests,
        totalFarmers,
        totalDrivers,
        groupingEfficiency,
        totalVolumeTons,
        totalSavings: Math.round(groupSavings),
        bookings: mockStore.requests.map(r => {
          const farmerUser = mockStore.users.find(u => u.id === r.farmer || u._id === r.farmer);
          return {
            ...r,
            farmerName: farmerUser ? farmerUser.name : "Farmer",
            driverName: r.driver ? (mockStore.users.find(u => u.id === r.driver || u._id === r.driver)?.name || "Driver") : null
          };
        }).reverse()
      });
    } else {
      const requests = await TransportRequest.find().populate("farmer", "name").populate("driver", "name");
      const totalFarmers = await User.countDocuments({ role: "farmer" });
      const totalDrivers = await User.countDocuments({ role: "driver" });

      const totalRequests = requests.length;
      const completedRequests = requests.filter(r => r.status === "delivered").length;
      const activeRequests = requests.filter(r => ["assigned", "in_transit"].includes(r.status)).length;
      const pendingRequests = requests.filter(r => r.status === "pending").length;

      const groupedCount = requests.filter(r => r.group).length;
      const groupingEfficiency = totalRequests > 0 ? Math.round((groupedCount / totalRequests) * 100) : 0;
      
      const totalVolumeKg = requests.reduce((sum, r) => sum + r.quantity, 0);
      const totalVolumeTons = Math.round((totalVolumeKg / 1000) * 10) / 10;

      const groupSavings = requests
        .filter(r => r.group)
        .reduce((sum, r) => sum + (r.price * 0.35), 0);

      res.json({
        totalRequests,
        completedRequests,
        activeRequests,
        pendingRequests,
        totalFarmers,
        totalDrivers,
        groupingEfficiency,
        totalVolumeTons,
        totalSavings: Math.round(groupSavings),
        bookings: requests.map(r => ({
          id: r._id,
          cropType: r.cropType,
          quantity: r.quantity,
          pickupLocation: r.pickupLocation,
          destinationLocation: r.destinationLocation,
          date: r.date,
          price: r.price,
          status: r.status,
          farmerName: r.farmer ? r.farmer.name : "Farmer",
          driverName: r.driver ? r.driver.name : null
        })).reverse()
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Admin analytics failed" });
  }
});


// Grouping Algorithm: Auto-groups requests going to same destination
async function autoGroupRequest(newReq) {
  try {
    const searchDistance = 25; // Search radius for grouping (25km source proximity)
    const pickupLat = newReq.pickupCoords.lat;
    const pickupLng = newReq.pickupCoords.lng;
    const destination = newReq.destinationLocation.toLowerCase().trim();

    if (useMock()) {
      // Find other ungrouped pending requests to the same general destination on same/similar date
      const candidates = mockStore.requests.filter(r => {
        if ((r.id && r.id === newReq.id) || r._id === newReq._id) return false;
        if (r.status !== "pending" || r.group) return false;
        
        const destMatch = r.destinationLocation.toLowerCase().trim().includes(destination) ||
                          destination.includes(r.destinationLocation.toLowerCase().trim());
        
        if (!destMatch) return false;

        // Check source coordinate proximity (within searchDistance)
        const dist = getDistance(pickupLat, pickupLng, r.pickupCoords.lat, r.pickupCoords.lng);
        return dist <= searchDistance;
      });

      if (candidates.length >= 1) {
        // We found matches! Let's form a cluster group.
        const allRequests = [newReq, ...candidates];
        const requestIds = allRequests.map(r => r._id || r.id);
        const totalQuantity = allRequests.reduce((sum, r) => sum + r.quantity, 0);

        // Group Coords is centroid of pickups
        const centerLat = allRequests.reduce((sum, r) => sum + r.pickupCoords.lat, 0) / allRequests.length;
        const centerLng = allRequests.reduce((sum, r) => sum + r.pickupCoords.lng, 0) / allRequests.length;

        // Distance from centroid to destination
        const destCoords = newReq.destinationCoords;
        const groupDistance = getDistance(centerLat, centerLng, destCoords.lat, destCoords.lng);

        // Shared truck cost (slightly higher rate for larger grouped capacity but split makes it cheaper)
        const groupPrice = calculateTransportCost(groupDistance, totalQuantity) * 0.75; // 25% discount on total truck group
        const sharedPrice = Math.round(groupPrice / allRequests.length);

        const newGroup = {
          _id: "grp_" + Math.random().toString(36).substr(2, 9),
          requests: requestIds,
          destinationLocation: newReq.destinationLocation,
          destinationCoords: destCoords,
          totalQuantity,
          totalPrice: groupPrice,
          sharedPricePerFarmer: sharedPrice,
          status: "pending",
          createdAt: new Date().toISOString()
        };

        mockStore.groups.push(newGroup);

        // Update each request in the mockStore
        mockStore.requests.forEach((r, idx) => {
          if (requestIds.includes(r.id) || requestIds.includes(r._id)) {
            mockStore.requests[idx].group = newGroup._id;
            mockStore.requests[idx].status = "grouped";
            mockStore.requests[idx].price = sharedPrice; // Update to shared discounted price!
          }
        });

        saveMockData();
        console.log(`🤖 Auto-grouped ${allRequests.length} requests going to ${newReq.destinationLocation}`);
      }
    } else {
      // MongoDB automatic grouping
      const candidates = await TransportRequest.find({
        status: "pending",
        group: { $exists: false },
        _id: { $ne: newReq._id },
        date: newReq.date
      });

      const matchedRequests = [newReq];

      for (const req of candidates) {
        const destMatch = req.destinationLocation.toLowerCase().trim().includes(destination) ||
                          destination.includes(req.destinationLocation.toLowerCase().trim());
        if (!destMatch) continue;

        const dist = getDistance(pickupLat, pickupLng, req.pickupCoords.lat, req.pickupCoords.lng);
        if (dist <= searchDistance) {
          matchedRequests.push(req);
        }
      }

      if (matchedRequests.length >= 2) {
        const requestIds = matchedRequests.map(r => r._id);
        const totalQuantity = matchedRequests.reduce((sum, r) => sum + r.quantity, 0);

        const centerLat = matchedRequests.reduce((sum, r) => sum + r.pickupCoords.lat, 0) / matchedRequests.length;
        const centerLng = matchedRequests.reduce((sum, r) => sum + r.pickupCoords.lng, 0) / matchedRequests.length;
        const groupDistance = getDistance(centerLat, centerLng, newReq.destinationCoords.lat, newReq.destinationCoords.lng);

        const groupPrice = calculateTransportCost(groupDistance, totalQuantity) * 0.75;
        const sharedPrice = Math.round(groupPrice / matchedRequests.length);

        const newGroup = new RequestGroup({
          requests: requestIds,
          destinationLocation: newReq.destinationLocation,
          destinationCoords: newReq.destinationCoords,
          totalQuantity,
          totalPrice: groupPrice,
          sharedPricePerFarmer: sharedPrice
        });

        await newGroup.save();

        // Update matching requests
        await TransportRequest.updateMany(
          { _id: { $in: requestIds } },
          { group: newGroup._id, status: "grouped", price: sharedPrice }
        );

        console.log(`🤖 Auto-grouped ${matchedRequests.length} requests going to ${newReq.destinationLocation}`);
      }
    }
  } catch (err) {
    console.error("Auto group algorithm error:", err);
  }
}

export default router;
