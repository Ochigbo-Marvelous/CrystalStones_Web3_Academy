const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const createLesson = async (data) => {
  const {
    module_id,
    title,
    content,
    video_url,
    order_index = 0,
    duration_minutes = 0,
  } = data;

  // Check if module exists
  const [modules] = await pool.query("SELECT id FROM modules WHERE id = ?", [module_id]);
  if (modules.length === 0) {
    throw new ApiError(404, "Module not found");
  }

  const [result] = await pool.query(
    `INSERT INTO lessons (module_id, title, content, video_url, order_index, duration_minutes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      module_id,
      title,
      content || null,
      video_url || null,
      order_index,
      duration_minutes,
    ]
  );

  const [lessons] = await pool.query("SELECT * FROM lessons WHERE id = ?", [result.insertId]);
  return lessons[0];
};

const getLessonsByModule = async (moduleId) => {
  const [lessons] = await pool.query(
    "SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index ASC",
    [moduleId]
  );
  return lessons;
};

const getLessonById = async (id) => {
  const [lessons] = await pool.query("SELECT * FROM lessons WHERE id = ?", [id]);

  if (lessons.length === 0) {
    throw new ApiError(404, "Lesson not found");
  }

  return lessons[0];
};

const updateLesson = async (id, data) => {
  await getLessonById(id);

  const fields = [];
  const values = [];

  const allowed = ["title", "content", "video_url", "order_index", "duration_minutes"];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    return getLessonById(id);
  }

  values.push(id);
  await pool.query(`UPDATE lessons SET ${fields.join(", ")} WHERE id = ?`, values);

  return getLessonById(id);
};

const deleteLesson = async (id) => {
  await getLessonById(id);
  await pool.query("DELETE FROM lessons WHERE id = ?", [id]);
  return { message: "Lesson deleted successfully" };
};

module.exports = {
  createLesson,
  getLessonsByModule,
  getLessonById,
  updateLesson,
  deleteLesson,
};