const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructor: { type: String, required: true },
    duration: { type: String, required: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Add student method
CourseSchema.methods.addStudent = async function (studentId) {
    if (this.enrolledStudents.length >= this.maxCapacity) {
        return { error: 'Course is at maximum capacity' };
    }
    if (this.enrolledStudents.includes(studentId)) {
        return { error: 'Student is already enrolled' };
    }
    this.enrolledStudents.push(studentId);
    await this.save();
    return { success: true };
};

// Remove student method
CourseSchema.methods.removeStudent = async function (studentId) {
    this.enrolledStudents = this.enrolledStudents.filter((id) => id.toString() !== studentId.toString());
    await this.save();
    return { success: true };
};

module.exports = mongoose.model('Course', CourseSchema);
