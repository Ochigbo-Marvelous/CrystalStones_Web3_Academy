const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const createCourse = async (data) => {
  const { title, description, level, is_paid = false, price_usd = 0, thumbnail } = data;

  const slug = generateSlug(title);

  // Check if slug already exists
  const [existing] = await pool.query("SELECT id FROM courses WHERE slug = ?", [slug]);
  if (existing.length > 0) {
    throw new ApiError(409, "A course with this title already exists");
  }

  const [result] = await pool.query(
    `INSERT INTO courses (title, slug, description, level, is_paid, price_usd, thumbnail)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, description || null, level, is_paid, price_usd, thumbnail || null]
  );

  const [courses] = await pool.query("SELECT * FROM courses WHERE id = ?", [result.insertId]);
  return courses[0];
};

const getAllCourses = async (filters = {}) => {
  let query = "SELECT * FROM courses WHERE is_published = TRUE";
  const params = [];

  if (filters.level) {
    query += " AND level = ?";
    params.push(filters.level);
  }

  query += " ORDER BY created_at DESC";

  const [courses] = await pool.query(query, params);
  return courses;
};

const getCourseById = async (id) => {
  const [courses] = await pool.query("SELECT * FROM courses WHERE id = ?", [id]);

  if (courses.length === 0) {
    throw new ApiError(404, "Course not found");
  }

  return courses[0];
};

const getCourseBySlug = async (slug) => {
  const [courses] = await pool.query("SELECT * FROM courses WHERE slug = ?", [slug]);

  if (courses.length === 0) {
    throw new ApiError(404, "Course not found");
  }

  return courses[0];
};

const updateCourse = async (id, data) => {
  const course = await getCourseById(id);

  const fields = [];
  const values = [];

  const allowed = ["title", "description", "level", "is_paid", "price_usd", "thumbnail", "is_published"];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (data.title) {
    fields.push("slug = ?");
    values.push(generateSlug(data.title));
  }

  if (fields.length === 0) {
    return course;
  }

  values.push(id);

  await pool.query(`UPDATE courses SET ${fields.join(", ")} WHERE id = ?`, values);

  return getCourseById(id);
};

const deleteCourse = async (id) => {
  await getCourseById(id); // check if exists
  await pool.query("DELETE FROM courses WHERE id = ?", [id]);
  return { message: "Course deleted successfully" };
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
};