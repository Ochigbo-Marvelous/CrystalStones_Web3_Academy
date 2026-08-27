const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const createModule = async (data) => {
  const { course_id, title, description, order_index = 0 } = data;

  // Check if course exists
  const [courses] = await pool.query("SELECT id FROM courses WHERE id = ?", [course_id]);
  if (courses.length === 0) {
    throw new ApiError(404, "Course not found");
  }

  const [result] = await pool.query(
    `INSERT INTO modules (course_id, title, description, order_index)
     VALUES (?, ?, ?, ?)`,
    [course_id, title, description || null, order_index]
  );

  // Update total_modules count on the course
  await pool.query(
    "UPDATE courses SET total_modules = total_modules + 1 WHERE id = ?",
    [course_id]
  );

  const [modules] = await pool.query("SELECT * FROM modules WHERE id = ?", [result.insertId]);
  return modules[0];
};

const getModulesByCourse = async (courseId) => {
  const [modules] = await pool.query(
    "SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC",
    [courseId]
  );
  return modules;
};

const getModuleById = async (id) => {
  const [modules] = await pool.query("SELECT * FROM modules WHERE id = ?", [id]);

  if (modules.length === 0) {
    throw new ApiError(404, "Module not found");
  }

  return modules[0];
};

const updateModule = async (id, data) => {
  await getModuleById(id);

  const fields = [];
  const values = [];

  const allowed = ["title", "description", "order_index"];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    return getModuleById(id);
  }

  values.push(id);
  await pool.query(`UPDATE modules SET ${fields.join(", ")} WHERE id = ?`, values);

  return getModuleById(id);
};

const deleteModule = async (id) => {
  const module = await getModuleById(id);

  await pool.query("DELETE FROM modules WHERE id = ?", [id]);

  // Decrease total_modules count
  await pool.query(
    "UPDATE courses SET total_modules = GREATEST(total_modules - 1, 0) WHERE id = ?",
    [module.course_id]
  );

  return { message: "Module deleted successfully" };
};

module.exports = {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  deleteModule,
};