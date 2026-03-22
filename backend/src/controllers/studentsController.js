import Student from "../models/Student.js";
import mongoose from "mongoose";

const flexibleSchema = new mongoose.Schema({}, { strict: false });

function getPreAdmissionModel(modelName, collectionName) {
  const preAdmissionDb = mongoose.connection.useDb("pre-admission", { useCache: true });
  return preAdmissionDb.models[modelName] || preAdmissionDb.model(modelName, flexibleSchema, collectionName);
}

export async function getAllStudents(req, res) {
  try {
    const { status, year, section, semester } = req.query;
    const query = {};

    // filter by enrollment status (the UI sends "All students" when nothing selected)
    if (status && status !== 'All students') {
      query.status = status;
    }

    // optional year filter (client passes year as string e.g. "1")
    if (year && year !== 'All') {
      const num = Number(year);
      if (!Number.isNaN(num)) {
        // accommodate documents where year might be stored as string or number
        query.$or = [{ year: num }, { year: year }];
      } else {
        query.year = year;
      }
    }

    if (section && section !== 'All') {
      query.section = section;
    }

    if (semester && semester !== 'All') {
      query.semester = semester;
    }

    console.log('getAllStudents query', query);

    const students = await Student.find(query).sort({ createdAt: -1 }); // newest first
    console.log('returned', students.length, 'students');
    res.status(200).json(students);
  } catch (error) {
    console.error("Error in getAllStudents controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPendingApplicants(req, res) {
  try {
    const Applicant = getPreAdmissionModel("Applicant", "applicants");
    const Validation = getPreAdmissionModel("Validation", "validation");

    const [applicants, validations] = await Promise.all([
      Applicant.find(
        { applicant_number: { $exists: true, $ne: null } },
        { _id: 0, applicant_number: 1, first_name: 1, last_name: 1 }
      ).lean(),
      Validation.find(
        { applicant_number: { $exists: true, $ne: null } },
        { _id: 0, applicant_number: 1, status: 1 }
      ).lean(),
    ]);

    const statusByApplicantNumber = new Map(
      validations.map((item) => [String(item.applicant_number), item.status])
    );

    const pendingApplicants = applicants
      .map((applicant) => {
        const applicantNumber = String(applicant.applicant_number);
        const firstName = String(applicant.first_name ?? "").trim();
        const lastName = String(applicant.last_name ?? "").trim();
        const status = statusByApplicantNumber.get(applicantNumber) ?? "Pending";

        return {
          applicant_number: applicantNumber,
          applicant_name: `${firstName} ${lastName}`.trim(),
          status,
        };
      })
      .filter((item) => {
        const normalizedStatus = String(item.status ?? "").toLowerCase();
        return !normalizedStatus || normalizedStatus.includes("pending");
      });

    res.status(200).json(pendingApplicants);
  } catch (error) {
    console.error("Error in getPendingApplicants controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStudentSections(req, res) {
  try {
    const sections = await Student.distinct("section", {
      section: { $exists: true, $ne: null },
    });

    const normalizedSections = sections
      .map(section => section?.trim())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));

    res.status(200).json(normalizedSections);
  } catch (error) {
    console.error("Error in getStudentSections controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStudentById(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found!" });
    res.json(student);
  } catch (error) {
    console.error("Error in getStudentById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStudentBySection(req, res) {
  try {
    const student = await Student.findBySection(req.params.section);
    if (!student) return res.status(404).json({ message: "Student not found!" });
    res.json(student);
  } catch (error) {
    console.error("Error in getStudentBySection controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createStudent(req, res) {
  try {
    const {
      student_number,
      first_name,
      last_name,
      name,
      section,
      semester,
      status,
      year,
      title,
      content,
    } = req.body;

    const student = new Student({
      student_number,
      first_name,
      last_name,
      name,
      section,
      semester,
      status,
      year,
      title,
      content,
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Error in createStudent controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateStudent(req, res) {
  try {
    const {
      student_number,
      first_name,
      last_name,
      name,
      section,
      semester,
      status,
      year,
      title,
      content,
    } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        student_number,
        first_name,
        last_name,
        name,
        section,
        semester,
        status,
        year,
        title,
        content,
      },
      {
        new: true,
      }
    );

    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Error in updateStudent controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteStudent(req, res) {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteStudent controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

function normalizeImportedStudent(raw = {}) {
  const firstName = String(raw.first_name ?? raw.firstName ?? "").trim();
  const lastName = String(raw.last_name ?? raw.lastName ?? "").trim();
  const name = String(raw.name ?? `${firstName} ${lastName}`.trim()).trim();

  return {
    student_number: String(raw.student_number ?? raw.studentNumber ?? "").trim(),
    first_name: firstName,
    last_name: lastName,
    name,
    year: raw.year != null && raw.year !== "" ? Number(raw.year) || String(raw.year) : undefined,
    section: String(raw.section ?? "").trim(),
    semester: String(raw.semester ?? "").trim(),
    status: String(raw.status ?? "Enrolled").trim() || "Enrolled",
  };
}

export async function importStudents(req, res) {
  try {
    const rows = Array.isArray(req.body?.students) ? req.body.students : [];
    if (!rows.length) {
      return res.status(400).json({ message: "students array is required" });
    }

    const normalized = rows
      .map(normalizeImportedStudent)
      .filter((student) => student.student_number);

    if (!normalized.length) {
      return res.status(400).json({ message: "No valid student rows found" });
    }

    const operations = normalized.map((student) => ({
      updateOne: {
        filter: { student_number: student.student_number },
        update: { $set: student },
        upsert: true,
      },
    }));

    const result = await Student.bulkWrite(operations, { ordered: false });

    res.status(200).json({
      message: "Students imported successfully",
      received: rows.length,
      imported: normalized.length,
      upserted: result.upsertedCount ?? 0,
      modified: result.modifiedCount ?? 0,
      matched: result.matchedCount ?? 0,
    });
  } catch (error) {
    console.error("Error in importStudents controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
