import { PrismaClient, Role, CourseLevel, CourseStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Prevent seeding in production
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seeding is not allowed in production environment');
    process.exit(1);
  }

  console.log('Starting seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const teacherPassword = await bcrypt.hash('Teacher123!', 10);
  const studentPassword = await bcrypt.hash('Student123!', 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@joyschool.com' },
    update: {},
    create: {
      email: 'admin@joyschool.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@joyschool.com' },
    update: {},
    create: {
      email: 'teacher@joyschool.com',
      passwordHash: teacherPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.TEACHER,
      bio: 'Experienced software engineer with 10+ years in web development',
      isActive: true,
      emailVerified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@joyschool.com' },
    update: {},
    create: {
      email: 'student@joyschool.com',
      passwordHash: studentPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.STUDENT,
      bio: 'Aspiring full-stack developer',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Created users:', { admin, teacher, student });

  // Create course categories
  const webDev = await prisma.courseCategory.upsert({
    where: { slug: 'web-development' },
    update: {},
    create: {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Learn to build modern web applications',
      order: 1,
    },
  });

  const frontend = await prisma.courseCategory.upsert({
    where: { slug: 'frontend' },
    update: {},
    create: {
      name: 'Frontend Development',
      slug: 'frontend',
      description: 'Master HTML, CSS, JavaScript, and modern frameworks',
      parentId: webDev.id,
      order: 1,
    },
  });

  const backend = await prisma.courseCategory.upsert({
    where: { slug: 'backend' },
    update: {},
    create: {
      name: 'Backend Development',
      slug: 'backend',
      description: 'Build server-side applications and APIs',
      parentId: webDev.id,
      order: 2,
    },
  });

  const dataScience = await prisma.courseCategory.upsert({
    where: { slug: 'data-science' },
    update: {},
    create: {
      name: 'Data Science',
      slug: 'data-science',
      description: 'Analyze data and build machine learning models',
      order: 2,
    },
  });

  console.log('Created categories:', { webDev, frontend, backend, dataScience });

  // Create a sample course
  const course = await prisma.course.upsert({
    where: { slug: 'complete-web-development' },
    update: {},
    create: {
      title: 'Complete Web Development Bootcamp',
      slug: 'complete-web-development',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more in this comprehensive course',
      thumbnail: '/images/course-thumbnail.jpg',
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      categoryId: frontend.id,
      teacherId: teacher.id,
      price: 0,
      durationHours: 40,
      prerequisites: ['Basic computer skills'],
      learningObjectives: [
        'Build responsive websites with HTML and CSS',
        'Create interactive applications with JavaScript',
        'Build modern web apps with React',
        'Create RESTful APIs with Node.js',
        'Deploy applications to the cloud',
      ],
      publishedAt: new Date(),
    },
  });

  console.log('Created course:', course);

  // Create course modules
  const module1 = await prisma.courseModule.create({
    data: {
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of web development',
      order: 1,
      courseId: course.id,
    },
  });

  const module2 = await prisma.courseModule.create({
    data: {
      title: 'HTML Fundamentals',
      description: 'Master HTML structure and semantics',
      order: 2,
      courseId: course.id,
    },
  });

  const module3 = await prisma.courseModule.create({
    data: {
      title: 'CSS Styling',
      description: 'Style your web pages with CSS',
      order: 3,
      courseId: course.id,
    },
  });

  console.log('Created modules:', { module1, module2, module3 });

  // Create lessons
  await prisma.lesson.create({
    data: {
      title: 'What is Web Development?',
      slug: 'what-is-web-development',
      content: '# What is Web Development?\n\nWeb development is the work involved in developing a website for the Internet or an intranet. Web development can range from developing a simple single static page of plain text to complex web applications, electronic businesses, and social network services.',
      type: 'TEXT',
      durationMinutes: 15,
      moduleId: module1.id,
      order: 1,
      isRequired: true,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'HTML Basics',
      slug: 'html-basics',
      content: '# HTML Basics\n\nHTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page semantically and originally included cues for the appearance of the document.',
      type: 'TEXT',
      durationMinutes: 20,
      codeExample: `<!DOCTYPE html>
<html>
<head>
    <title>My First Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is my first web page.</p>
</body>
</html>`,
      moduleId: module2.id,
      order: 1,
      isRequired: true,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'CSS Introduction',
      slug: 'css-introduction',
      content: '# CSS Introduction\n\nCSS (Cascading Style Sheets) is used to style and layout web pages. It describes how HTML elements should be displayed on screen.',
      type: 'CODE',
      durationMinutes: 25,
      codeExample: `body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    margin: 0;
    padding: 20px;
}

h1 {
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}`,
      moduleId: module3.id,
      order: 1,
      isRequired: true,
    },
  });

  console.log('Created lessons');

  // Create a sample quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Web Development Basics Quiz',
      description: 'Test your knowledge of web development fundamentals',
      courseId: course.id,
      moduleId: module1.id,
      timeLimitMinutes: 10,
      passingScore: 70,
      maxAttempts: 3,
      shuffleQuestions: false,
      order: 1,
    },
  });

  console.log('Created quiz:', quiz);

  // Create quiz questions
  const q1 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: 'MULTIPLE_CHOICE',
      questionText: 'What does HTML stand for?',
      points: 1,
      order: 1,
    },
  });

  await prisma.answerOption.createMany({
    data: [
      { questionId: q1.id, text: 'Hyper Text Markup Language', isCorrect: true, order: 1 },
      { questionId: q1.id, text: 'Home Tool Markup Language', isCorrect: false, order: 2 },
      { questionId: q1.id, text: 'Hyperlinks and Text Markup Language', isCorrect: false, order: 3 },
      { questionId: q1.id, text: 'Hyper Tool Multi Language', isCorrect: false, order: 4 },
    ],
  });

  const q2 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      type: 'TRUE_FALSE',
      questionText: 'CSS is used to style web pages.',
      points: 1,
      order: 2,
    },
  });

  await prisma.answerOption.createMany({
    data: [
      { questionId: q2.id, text: 'True', isCorrect: true, order: 1 },
      { questionId: q2.id, text: 'False', isCorrect: false, order: 2 },
    ],
  });

  console.log('Created quiz questions');

  // Create a sample assignment
  const assignment = await prisma.assignment.create({
    data: {
      title: 'Build Your First Web Page',
      description: 'Create a simple HTML page about yourself',
      instructions: 'Create an HTML page that includes:\n1. A heading with your name\n2. A paragraph about yourself\n3. At least one list\n4. Proper HTML structure',
      courseId: course.id,
      moduleId: module2.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      maxPoints: 100,
      allowLateSubmission: true,
      order: 1,
    },
  });

  console.log('Created assignment:', assignment);

  // Create an announcement
  await prisma.announcement.create({
    data: {
      title: 'Welcome to JoyEdu!',
      content: 'We are excited to launch JoyEdu, your new online learning platform. Start exploring our courses and begin your learning journey today!',
      targetAudience: ['STUDENT', 'TEACHER', 'ADMIN'],
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  console.log('Created announcement');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
