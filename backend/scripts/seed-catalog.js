require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

const CONTENT_DIRS = [
  path.join(__dirname, "..", "content", "basic"),
  path.join(__dirname, "..", "content", "intermediate"),
];

const lessonCount = (course) =>
  (course.modules || []).reduce((sum, module) => sum + (module.lessons || []).length, 0);

const readJsonFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
  const bySlug = new Map();

  for (const name of files) {
    const full = path.join(dir, name);
    const course = JSON.parse(fs.readFileSync(full, "utf8"));
    const count = lessonCount(course);
    console.log(`Reading ${name} → ${course.slug || "NO SLUG"} (${count} lessons)`);
    if (!course.slug) continue;

    const previous = bySlug.get(course.slug);
    if (!previous || count > previous._lessonCount) {
      course._lessonCount = count;
      course._file = name;
      bySlug.set(course.slug, course);
    } else {
      console.log(`Ignoring ${name}; ${previous._file} has more lessons for ${course.slug}`);
    }
  }

  return [...bySlug.values()];
};

const seedCourse = async (course) => {
  const [existing] = await pool.query("SELECT id FROM courses WHERE slug = ?", [course.slug]);

  let courseId;

  if (existing.length > 0) {
    courseId = existing[0].id;
    await pool.query(
      `UPDATE courses
       SET title = ?, description = ?, level = ?, is_paid = ?, price_usd = ?, is_published = ?, total_modules = ?
       WHERE id = ?`,
      [
        course.title,
        course.description,
        course.level,
        course.is_paid ? 1 : 0,
        course.price_usd || 0,
        course.is_published ? 1 : 0,
        course.modules.length,
        courseId,
      ]
    );

    const [modules] = await pool.query("SELECT id FROM modules WHERE course_id = ?", [courseId]);
    const moduleIds = modules.map((row) => row.id);

    if (moduleIds.length > 0) {
      await pool.query("DELETE FROM brain_teasers WHERE module_id IN (?)", [moduleIds]);
      await pool.query("DELETE FROM lessons WHERE module_id IN (?)", [moduleIds]);
      await pool.query("DELETE FROM modules WHERE course_id = ?", [courseId]);
    }
  } else {
    const [result] = await pool.query(
      `INSERT INTO courses
       (title, slug, description, level, is_paid, price_usd, is_published, total_modules)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course.title,
        course.slug,
        course.description,
        course.level,
        course.is_paid ? 1 : 0,
        course.price_usd || 0,
        course.is_published ? 1 : 0,
        course.modules.length,
      ]
    );
    courseId = result.insertId;
  }

  let lessonTotal = 0;
  let quizTotal = 0;

  for (const module of course.modules) {
    const [moduleResult] = await pool.query(
      `INSERT INTO modules (course_id, title, description, order_index)
       VALUES (?, ?, ?, ?)`,
      [courseId, module.title, module.description || module.title, module.order_index]
    );
    const moduleId = moduleResult.insertId;

    for (const lesson of module.lessons || []) {
      await pool.query(
        `INSERT INTO lessons (module_id, title, content, video_url, order_index, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          moduleId,
          lesson.title,
          lesson.content || "",
          lesson.video_url || null,
          lesson.order_index,
          lesson.duration_minutes || 0,
        ]
      );
      lessonTotal += 1;
    }

    for (const item of module.quiz || []) {
      await pool.query(
        `INSERT INTO brain_teasers
         (module_id, question, option_a, option_b, option_c, option_d, correct_option, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          moduleId,
          item.question,
          item.option_a,
          item.option_b,
          item.option_c,
          item.option_d,
          item.correct_option,
          item.order_index,
        ]
      );
      quizTotal += 1;
    }
  }

  console.log(`Seeded: ${course.title} from ${course._file} (${lessonTotal} lessons, ${quizTotal} quiz questions)`);
};

const run = async () => {
  await pool.query("ALTER TABLE lessons MODIFY content MEDIUMTEXT NOT NULL");

  const bySlug = new Map();
  for (const dir of CONTENT_DIRS) {
    for (const course of readJsonFiles(dir)) {
      const previous = bySlug.get(course.slug);
      if (!previous || course._lessonCount > previous._lessonCount) {
        bySlug.set(course.slug, course);
      }
    }
  }

  const courses = [...bySlug.values()];
  if (courses.length === 0) {
    throw new Error("No JSON files found in backend/content/basic or backend/content/intermediate");
  }

  for (const course of courses) {
    if (!course.slug || !course.title) {
      throw new Error("Each course JSON must have title and slug");
    }
    await seedCourse(course);
  }
};

run()
  .then(() => {
    console.log("Catalog seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Catalog seed failed:", error.message);
    process.exit(1);
  });