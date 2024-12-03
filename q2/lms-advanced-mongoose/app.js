const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');

const app = express();
app.use(express.json());

const PORT = 3000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/LMS_DB';

// MongoDB Connection
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Connection error:', err));

// Advanced Querying

// Get users filtered by role with specific fields
app.get('/users', async (req, res) => {
    try {
        const { role } = req.query;
        const users = await User.find(role ? { role } : {}).select('name email role');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get courses filtered by capacity and sorted by title
app.get('/courses', async (req, res) => {
    try {
        const { minCapacity = 0 } = req.query;
        const courses = await Course.find({ maxCapacity: { $gte: parseInt(minCapacity) } }).sort('title');
        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Enrollment Logic
app.post('/enroll', async (req, res) => {
    const { userId, courseId } = req.body;

    try {
        const user = await User.findById(userId);
        const course = await Course.findById(courseId);

        if (!user || !course) {
            return res.status(404).json({ error: 'User or Course not found' });
        }

        if (user.role !== 'student') {
            return res.status(400).json({ error: 'Only students can enroll in courses' });
        }

        if (course.enrolledStudents.includes(userId)) {
            return res.status(400).json({ error: 'User already enrolled in this course' });
        }

        if (course.enrolledStudents.length >= course.maxCapacity) {
            return res.status(400).json({ error: 'Course is at maximum capacity' });
        }

        user.enrolledCourses.push(courseId);
        course.enrolledStudents.push(userId);

        await user.save();
        await course.save();

        res.status(200).json({ message: 'Enrollment successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Error handling for invalid routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
