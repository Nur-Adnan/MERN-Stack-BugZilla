require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/userModel");
const BugModel = require("./models/BugModel");
const nodemailer = require("nodemailer");
// const { LocalStorage } = require('node-localstorage');

const SECRET_KEY = "super-secret-key";

const app = express();
app.use(express.json());

const dbURI =
  process.env.MONGODB_URI;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(3001, () => {
      console.log("Server connected to port 3001 and MongoDb");
    });
  })
  .catch((error) => {
    console.log("Unable to connect to Server and/or MongoDB", error);
  });

// middleware
app.use(bodyParser.json());
app.use(cors());

//Routes

//LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }); // Find user by email
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password); // Compare passwords
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Generate a JWT token (you'll need to set your own SECRET_KEY)
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1hr",
    });
    res.json({ message: "Login successful", token, role: user.role }); // Return the token
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
});

// POST route to send verification code
app.post("/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code

    // Save the code in-memory for simplicity; ideally, use a database or a cache
    global.verificationCodes = global.verificationCodes || {};
    global.verificationCodes[email] = verificationCode;

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "jerrell29@ethereal.email",
        pass: "byqDyzwrT2uRJ8HmnY",
      },
    });

    const mailOptions = {
      from: "jerrell29@ethereal.email",
      // Replace with your Ethereal email address
      to: email, // The user's email address
      subject: "Your Verification Code",
      text: `Your verification code is ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error sending code" });
  }
});

// POST route to verify the code and register the user
app.post("/verify-code", async (req, res) => {
  try {
    const { fullName, email, password, verificationCode, phoneNumber, role } =
      req.body;

    if (global.verificationCodes[email] === parseInt(verificationCode, 10)) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
        role,
      });

      // Only add phoneNumber if it's provided
      if (phoneNumber) {
        newUser.phoneNumber = phoneNumber;
      }

      await newUser.save();

      // Clear the code after successful verification
      delete global.verificationCodes[email];

      res
        .status(201)
        .json({ success: true, message: "User created successfully" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error verifying code" });
  }
});

//GET Registered Users
app.get("/register", async (req, res) => {
  try {
    const users = await User.find(); // Retrieve all users
    res.status(201).json(users);
  } catch (error) {
    res.status(500).json({ error: "Unable to get users" });
  }
});

// POST - Submit a new bug report
app.post("/bugfixing", async (req, res) => {
  try {
    const { url, issue, details, testing, describe, sendReport, email } = req.body;
    // Assuming 'screenshot' is sent as a base64 encoded string
    const screenshotBuffer = req.body.screenshot
      ? Buffer.from(req.body.screenshot, "base64")
      : null;

    const newBug = new BugModel({
      email,
      url,
      issue,
      details,
      testing,
      describe,
      screenshot: {
        data: screenshotBuffer,
        contentType: "image/png", // or the appropriate content type
      },
      sendReport,
    });

    await newBug.save();
    res.status(201).json({ message: "Bug report submitted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error submitting bug report", details: error.message });
  }
});

app.get("/bugs", async (req, res) => {
  try {
    const bugs = await BugModel.find();
    const bugsWithImages = bugs.map((bug) => {
      const image = bug.screenshot
        ? `data:${
            bug.screenshot.contentType
          };base64,${bug.screenshot.data.toString("base64")}`
        : null;
      return { ...bug.toObject(), screenshot: image };
    });
    res.status(200).json(bugsWithImages);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Unable to fetch bugs", details: error.message });
  }
});

// Block a bug report
app.post("/block-bug", async (req, res) => {
  try {
    const { bugId } = req.body;

    await BugModel.updateOne({ _id: bugId }, { $set: { blocked: true } });
    res.json({ message: "Bug report blocked successfully" });
  } catch (error) {
    console.error("Error blocking bug report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all blocked bug reports
app.get("/blocked-bugs", async (req, res) => {
  try {
    const blockedBugs = await BugModel.find({ blocked: true });
    res.json(blockedBugs);
  } catch (error) {
    console.error("Error fetching blocked bug reports:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all blocked bug reports
app.get("/solved-bugs", async (req, res) => {
  try {
    const { email } = req.query; // Retrieve email from query parameters
    console.log("email got " + email);
    const blockedBugs = await BugModel.find({ email: email });
    res.json(blockedBugs);
  } catch (error) {
    console.error("Error fetching blocked bug reports:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Unblock a bug report
app.post("/unblock-bug", async (req, res) => {
  try {
    const { bugId } = req.body;
    await BugModel.updateOne({ _id: bugId }, { $set: { blocked: false } });
    res.json({ message: "Bug report unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking bug report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//Bug History
// app.get("/userBugTable", async (req, res) => {
//   try {
//     const {LocalStorage} = new LocalStorage();
//     const bugs = await BugModel.find();
//     const bugsWithImages = bugs.map((bug) => {
//       const image = bug.screenshot
//         ? `data:${
//             bug.screenshot.contentType
//           };base64,${bug.screenshot.data.toString("base64")}`
//         : null;
//       return { ...bug.toObject(), screenshot: image };
//     });
//     res.status(200).json(bugsWithImages);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Unable to fetch bugs", details: error.message });
//   }
// });




