import mongoose from "mongoose";

// 1st step: You need to create a schema
// 2nd step: You would create a model based off of that schema

const studentSchema = new mongoose.Schema(
  {
    // basic identifying fields; adjust as needed for your application
    student_number: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
    },
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: "Enrolled",
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
    },
    // legacy fields still around (if used by other parts of the code)
    title: {
      type: String,
    },
    content: {
      type: String,
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
