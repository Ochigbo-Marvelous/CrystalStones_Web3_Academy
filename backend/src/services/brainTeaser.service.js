const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const createBrainTeaser = async (data) => {
  const {
    module_id,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    order_index = 0,
  } = data;

  // Check if module exists
  const [modules] = await pool.query("SELECT id FROM modules WHERE id = ?", [module_id]);
  if (modules.length === 0) {
    throw new ApiError(404, "Module not found");
  }

  const [result] = await pool.query(
    `INSERT INTO brain_teasers 
     (module_id, question, option_a, option_b, option_c, option_d, correct_option, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [module_id, question, option_a, option_b, option_c, option_d, correct_option, order_index]
  );

  const [teasers] = await pool.query("SELECT * FROM brain_teasers WHERE id = ?", [result.insertId]);
  return teasers[0];
};

const getBrainTeasersByModule = async (moduleId) => {
  const [teasers] = await pool.query(
    `SELECT id, module_id, question, option_a, option_b, option_c, option_d, order_index 
     FROM brain_teasers 
     WHERE module_id = ? 
     ORDER BY order_index ASC`,
    [moduleId]
  );
  return teasers;
};

// Admin version (includes correct answer)
const getBrainTeasersByModuleAdmin = async (moduleId) => {
  const [teasers] = await pool.query(
    "SELECT * FROM brain_teasers WHERE module_id = ? ORDER BY order_index ASC",
    [moduleId]
  );
  return teasers;
};

const getBrainTeaserById = async (id) => {
  const [teasers] = await pool.query("SELECT * FROM brain_teasers WHERE id = ?", [id]);

  if (teasers.length === 0) {
    throw new ApiError(404, "Brain teaser not found");
  }

  return teasers[0];
};

const updateBrainTeaser = async (id, data) => {
  await getBrainTeaserById(id);

  const fields = [];
  const values = [];

  const allowed = [
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_option",
    "order_index",
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    return getBrainTeaserById(id);
  }

  values.push(id);
  await pool.query(`UPDATE brain_teasers SET ${fields.join(", ")} WHERE id = ?`, values);

  return getBrainTeaserById(id);
};

const deleteBrainTeaser = async (id) => {
  await getBrainTeaserById(id);
  await pool.query("DELETE FROM brain_teasers WHERE id = ?", [id]);
  return { message: "Brain teaser deleted successfully" };
};

module.exports = {
  createBrainTeaser,
  getBrainTeasersByModule,
  getBrainTeasersByModuleAdmin,
  getBrainTeaserById,
  updateBrainTeaser,
  deleteBrainTeaser,
};