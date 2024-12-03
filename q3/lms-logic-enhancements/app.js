const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');

const app = express();
app.use(express.json());

const PORT = 3000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/LMS_DB';

// Connect to MongoDB
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.post('/courses/:id/add-student', async (req, res) => {
    const { studentId } = req.body;
    try {
        const course = await Course.findById(req.params.id);
        const user = await User.findById(studentId);

        if (!course || !user) {
            return res.status(404).json({ error: 'Course or User not found' });
        }

        const result = await course.addStudent(studentId);
        if (result.error) return res.status(400).json(result);

        user.enrolledCourses.push(course._id);
        await user.save();
        res.status(200).json({ message: 'Student added successfully', course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/courses/:id/remove-student', async (req, res) => {
    const { studentId } = req.body;
    try {
        const course = await Course.findById(req.params.id);
        const user = await User.findById(studentId);

        if (!course || !user) {
            return res.status(404).json({ error: 'Course or User not found' });
        }

        const result = await course.removeStudent(studentId);
        if (result.error) return res.status(400).json(result);

        user.enrolledCourses = user.enrolledCourses.filter((id) => id.toString() !== course._id.toString());
        await user.save();
        res.status(200).json({ message: 'Student removed successfully', course });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        if (course.enrolledStudents.length > 0) {
            return res.status(400).json({ error: 'Cannot delete course with enrolled students' });
        }

        await course.deleteOne();
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        for (const courseId of user.enrolledCourses) {
            const course = await Course.findById(courseId);
            if (course) await course.removeStudent(user._id);
        }

        await user.deleteOne();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
