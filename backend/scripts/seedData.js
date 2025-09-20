// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// require('dotenv').config();

// // Import models
// const User = require('../models/User');
// const Module = require('../models/Module');
// const Question = require('../models/Question');

// // MongoDB connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning-platform', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

// const seedData = async () => {
//   try {
//     console.log('🌱 Starting data seeding...');

//     // Clear existing data
//   await User.deleteMany({});
//   await Module.deleteMany({});
//     await Question.deleteMany({});
//     console.log('✅ Cleared existing data');
  
//   // Create admin user
//     const adminPassword = await bcrypt.hash('admin123', 12);
//   const adminUser = new User({
//     name: 'Admin User',
//       email: 'admin@company.com',
//       password: adminPassword,
//     userType: 'admin',
//       phone: '+1234567890',
//       department: 'Management',
//       employeeId: 'ADMIN001',
//       status: 'Active',
//       kpiScore: 0,
//       isActive: true
//   });
//   await adminUser.save();
//     console.log('✅ Admin user created');

//     // Create regular user
//     const userPassword = await bcrypt.hash('user123', 12);
//     const regularUser = new User({
//       name: 'John Doe',
//       email: 'john.doe@company.com',
//       password: userPassword,
//       userType: 'user',
//       phone: '+9876543210',
//       department: 'Sales',
//       employeeId: 'EMP001',
//       status: 'Active',
//       kpiScore: 0,
//       isActive: true
//     });
//     await regularUser.save();
//     console.log('✅ Regular user created');

//     // Create sample modules
//     const modules = [
//       {
//         title: 'Customer Service Fundamentals',
//         description: 'Learn the essential skills for providing excellent customer service. This module covers communication techniques, problem-solving strategies, and best practices for handling customer inquiries.',
//         videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
//         duration: 15,
//         difficulty: 'Beginner',
//         category: 'Customer Service',
//         passPercentage: 70,
//         totalQuestions: 5,
//         timeLimit: 300, // 5 minutes
//         isActive: true,
//         order: 1,
//         thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
//         tags: ['customer service', 'communication', 'beginner']
//       },
//       {
//         title: 'Sales Techniques & Strategies',
//         description: 'Master proven sales techniques and strategies to increase your conversion rates. Learn about prospecting, objection handling, and closing techniques.',
//         videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
//         duration: 20,
//         difficulty: 'Intermediate',
//         category: 'Sales',
//         passPercentage: 75,
//         totalQuestions: 6,
//         timeLimit: 360, // 6 minutes
//         isActive: true,
//         order: 2,
//         thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
//         tags: ['sales', 'techniques', 'intermediate']
//       },
//       {
//         title: 'Product Knowledge & Features',
//         description: 'Deep dive into our product portfolio. Understand features, benefits, and competitive advantages to better serve customers.',
//         videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
//         duration: 25,
//         difficulty: 'Advanced',
//         category: 'Product Training',
//         passPercentage: 80,
//         totalQuestions: 8,
//         timeLimit: 480, // 8 minutes
//         isActive: true,
//         order: 3,
//         thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
//         tags: ['product', 'knowledge', 'advanced']
//       },
//       {
//         title: 'Communication Skills',
//         description: 'Enhance your communication skills for better customer interactions. Learn active listening, clear messaging, and professional etiquette.',
//         videoUrl: 'https://www.youtube.com/watch?v=ZZZ7k8cMA-4',
//         duration: 18,
//         difficulty: 'Beginner',
//         category: 'Communication',
//         passPercentage: 70,
//         totalQuestions: 5,
//         timeLimit: 300, // 5 minutes
//         isActive: true,
//         order: 4,
//         thumbnail: 'https://img.youtube.com/vi/ZZZ7k8cMA-4/maxresdefault.jpg',
//         tags: ['communication', 'skills', 'beginner']
//       },
//       {
//         title: 'Time Management for Field Executives',
//         description: 'Learn effective time management strategies specifically designed for field executives. Optimize your daily routine and increase productivity.',
//         videoUrl: 'https://www.youtube.com/watch?v=8jPQjjsBbIc',
//         duration: 22,
//         difficulty: 'Intermediate',
//         category: 'Productivity',
//         passPercentage: 75,
//         totalQuestions: 6,
//         timeLimit: 360, // 6 minutes
//         isActive: true,
//         order: 5,
//         thumbnail: 'https://img.youtube.com/vi/8jPQjjsBbIc/maxresdefault.jpg',
//         tags: ['time management', 'productivity', 'intermediate']
//       }
//     ];

//     const createdModules = [];
//     for (const moduleData of modules) {
//       const module = new Module(moduleData);
//       await module.save();
//       createdModules.push(module);
//       console.log(`✅ Module created: ${module.title}`);
//     }

//     // Create questions for each module
//     const questionsData = [
//       // Customer Service Fundamentals
//       {
//         moduleId: createdModules[0]._id,
//         questions: [
//           {
//             question: 'What is the most important aspect of customer service?',
//             options: ['Speed', 'Empathy', 'Price', 'Location'],
//             correctAnswer: 1,
//             explanation: 'Empathy is crucial as it helps understand customer needs and build trust.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'How should you handle an angry customer?',
//             options: ['Ignore them', 'Listen actively and apologize', 'Argue back', 'Transfer immediately'],
//             correctAnswer: 1,
//             explanation: 'Active listening and genuine apology help de-escalate the situation.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What does "going the extra mile" mean in customer service?',
//             options: ['Working overtime', 'Exceeding customer expectations', 'Traveling far', 'Running fast'],
//             correctAnswer: 1,
//             explanation: 'Going the extra mile means exceeding what customers expect from you.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'Which communication skill is most important for customer service?',
//             options: ['Speaking loudly', 'Active listening', 'Using technical jargon', 'Writing emails'],
//             correctAnswer: 1,
//             explanation: 'Active listening helps understand customer needs and concerns.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What should you do if you cannot solve a customer\'s problem?',
//             options: ['Tell them to call back later', 'Escalate to a supervisor', 'Ignore the problem', 'Give up'],
//             correctAnswer: 1,
//             explanation: 'Escalating to a supervisor ensures the customer gets proper assistance.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           }
//         ]
//       },
//       // Sales Techniques & Strategies
//       {
//         moduleId: createdModules[1]._id,
//       questions: [
//         {
//             question: 'What is the first step in the sales process?',
//             options: ['Closing', 'Prospecting', 'Presentation', 'Follow-up'],
//             correctAnswer: 1,
//             explanation: 'Prospecting is the first step to identify potential customers.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'How do you handle customer objections?',
//             options: ['Ignore them', 'Listen and address concerns', 'Argue with customer', 'End the conversation'],
//             correctAnswer: 1,
//             explanation: 'Listening and addressing concerns shows professionalism and builds trust.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What is the purpose of a needs assessment?',
//             options: ['To waste time', 'To understand customer requirements', 'To increase price', 'To delay sale'],
//             correctAnswer: 1,
//             explanation: 'Needs assessment helps understand what the customer actually needs.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'Which closing technique involves creating urgency?',
//             options: ['Assumptive close', 'Urgency close', 'Alternative close', 'Direct close'],
//             correctAnswer: 1,
//             explanation: 'Urgency close creates a sense of limited time or availability.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'hard'
//           },
//           {
//             question: 'What is the most important factor in building customer relationships?',
//             options: ['Price', 'Trust', 'Speed', 'Location'],
//           correctAnswer: 1,
//             explanation: 'Trust is the foundation of any successful customer relationship.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'How often should you follow up with prospects?',
//             options: ['Never', 'Once a year', 'Consistently but not too frequently', 'Every day'],
//             correctAnswer: 2,
//             explanation: 'Consistent but not excessive follow-up maintains interest without being annoying.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           }
//         ]
//       },
//       // Product Knowledge & Features
//       {
//         moduleId: createdModules[2]._id,
//       questions: [
//         {
//             question: 'Why is product knowledge important for sales?',
//             options: ['To impress customers', 'To answer questions confidently', 'To increase price', 'To waste time'],
//             correctAnswer: 1,
//             explanation: 'Confident answers build customer trust and credibility.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'What should you focus on when explaining product features?',
//             options: ['Technical specifications only', 'Benefits to the customer', 'Company history', 'Price only'],
//             correctAnswer: 1,
//             explanation: 'Customers care about how the product benefits them, not just features.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'How do you handle questions about product limitations?',
//             options: ['Lie about capabilities', 'Be honest and suggest alternatives', 'Ignore the question', 'Change topic'],
//             correctAnswer: 1,
//             explanation: 'Honesty builds trust, and suggesting alternatives shows problem-solving skills.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What is the difference between features and benefits?',
//             options: ['There is no difference', 'Features are what it does, benefits are what it does for you', 'Features cost money, benefits are free', 'Features are technical, benefits are emotional'],
//             correctAnswer: 1,
//             explanation: 'Features describe capabilities, benefits describe value to the customer.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'hard'
//           },
//           {
//             question: 'How should you stay updated on product changes?',
//             options: ['Ignore updates', 'Read company communications regularly', 'Ask customers', 'Wait for complaints'],
//             correctAnswer: 1,
//             explanation: 'Regular reading of company communications keeps you informed.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What is the best way to demonstrate product knowledge?',
//             options: ['Memorizing specifications', 'Understanding customer needs and matching solutions', 'Reading manuals', 'Attending meetings'],
//             correctAnswer: 1,
//             explanation: 'Matching solutions to customer needs shows practical product knowledge.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'How do you handle competitive product comparisons?',
//             options: ['Badmouth competitors', 'Focus on your product\'s strengths', 'Avoid the topic', 'Agree with customer'],
//           correctAnswer: 1,
//             explanation: 'Focusing on your strengths is professional and effective.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'hard'
//         },
//         {
//             question: 'What role does product knowledge play in objection handling?',
//             options: ['No role', 'Helps provide accurate responses', 'Confuses customers', 'Increases price'],
//           correctAnswer: 1,
//             explanation: 'Accurate responses based on product knowledge help overcome objections.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           }
//         ]
//       },
//       // Communication Skills
//       {
//         moduleId: createdModules[3]._id,
//       questions: [
//         {
//             question: 'What is active listening?',
//             options: ['Hearing words', 'Fully concentrating on what is being said', 'Interrupting to respond', 'Taking notes'],
//             correctAnswer: 1,
//             explanation: 'Active listening involves full concentration and understanding.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'How should you start a professional conversation?',
//             options: ['With a joke', 'With a greeting and introduction', 'With a complaint', 'With silence'],
//             correctAnswer: 1,
//             explanation: 'Professional conversations should start with proper greetings.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'What is the purpose of paraphrasing in communication?',
//             options: ['To waste time', 'To confirm understanding', 'To confuse others', 'To show off'],
//             correctAnswer: 1,
//             explanation: 'Paraphrasing confirms that you understood the message correctly.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'How do you handle communication barriers?',
//             options: ['Ignore them', 'Identify and address them', 'Blame others', 'Give up'],
//             correctAnswer: 1,
//             explanation: 'Identifying and addressing barriers improves communication effectiveness.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What is nonverbal communication?',
//             options: ['Written messages', 'Body language and gestures', 'Phone calls', 'Emails'],
//           correctAnswer: 1,
//             explanation: 'Nonverbal communication includes body language, gestures, and facial expressions.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           }
//         ]
//       },
//       // Time Management
//       {
//         moduleId: createdModules[4]._id,
//       questions: [
//         {
//             question: 'What is the first step in effective time management?',
//             options: ['Working harder', 'Prioritizing tasks', 'Working longer hours', 'Delegating everything'],
//             correctAnswer: 1,
//             explanation: 'Prioritizing tasks helps focus on what\'s most important.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'How should you handle interruptions during work?',
//             options: ['Ignore all interruptions', 'Address urgent ones, schedule others', 'Stop working', 'Complain about them'],
//             correctAnswer: 1,
//             explanation: 'Addressing urgent interruptions while scheduling others maintains productivity.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What is the benefit of time blocking?',
//             options: ['Wasting time', 'Better focus and productivity', 'Avoiding work', 'Making excuses'],
//             correctAnswer: 1,
//             explanation: 'Time blocking improves focus and overall productivity.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'How do you handle multiple deadlines?',
//             options: ['Panic', 'Prioritize and plan', 'Ignore deadlines', 'Ask for extensions'],
//             correctAnswer: 1,
//             explanation: 'Prioritizing and planning helps meet multiple deadlines effectively.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//           },
//           {
//             question: 'What is the purpose of a daily schedule?',
//             options: ['To restrict freedom', 'To organize and optimize time', 'To create stress', 'To waste time'],
//             correctAnswer: 1,
//             explanation: 'A daily schedule helps organize and optimize time usage.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'easy'
//           },
//           {
//             question: 'How should you handle unexpected tasks?',
//             options: ['Ignore them', 'Assess urgency and adjust schedule', 'Complain', 'Quit'],
//             correctAnswer: 1,
//             explanation: 'Assessing urgency and adjusting schedule maintains productivity.',
//             marks: 2,
//             questionType: 'multiple_choice',
//             difficulty: 'medium'
//         }
//       ]
//     }
//   ];

//     // Create questions for each module
//     for (const moduleQuestions of questionsData) {
//       for (const questionData of moduleQuestions.questions) {
//         const question = new Question({
//           moduleId: moduleQuestions.moduleId,
//           ...questionData,
//           isActive: true
//         });
//         await question.save();
//       }
//       console.log(`✅ Questions created for module: ${moduleQuestions.moduleId}`);
//     }

//     console.log('🎉 Data seeding completed successfully!');
//     console.log('\n📋 Summary:');
//     console.log(`- Admin User: admin@company.com / admin123`);
//     console.log(`- Regular User: john.doe@company.com / user123`);
//     console.log(`- Modules Created: ${modules.length}`);
//     console.log(`- Total Questions: ${questionsData.reduce((acc, mq) => acc + mq.questions.length, 0)}`);
    
//   } catch (error) {
//     console.error('❌ Error seeding data:', error);
//   } finally {
//     mongoose.connection.close();
//   }
// };

// seedData();
