import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = (password: string) => bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sau.ac.in' },
    update: {},
    create: {
      name: 'Dr. Rajesh Kumar',
      email: 'admin@sau.ac.in',
      role: 'ADMIN',
      password: await hash('admin123'),
      avatarUrl: 'https://placehold.co/200x200/png',
      enrollmentNo: 'ADMIN-001',
      course: 'Administration',
      coursePreference: 'LAW',
      gender: 'OTHER',
      sportsInterests: ['Badminton'],
      hobbies: ['Reading'],
      sleepSchedule: 'BALANCED',
      noiseTolerance: 'MEDIUM',
      studyHours: 6,
      sleepHours: 7,
      careerGoal: 'Run hostel operations efficiently',
      address: 'South Asian University Campus',
      parentContactNo: '+91-9999999991',
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  const warden = await prisma.user.upsert({
    where: { email: 'warden@sau.ac.in' },
    update: {},
    create: {
      name: 'Mrs. Priya Sharma',
      email: 'warden@sau.ac.in',
      role: 'WARDEN',
      password: await hash('warden123'),
      avatarUrl: 'https://placehold.co/200x200/png',
      enrollmentNo: 'WARDEN-001',
      course: 'Administration',
      coursePreference: 'SOCIOLOGY',
      gender: 'FEMALE',
      sportsInterests: ['Yoga'],
      hobbies: ['Reading', 'Writing'],
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 'MEDIUM',
      studyHours: 5,
      sleepHours: 8,
      careerGoal: 'Support student wellbeing and discipline',
      address: 'Warden Residence, SAU',
      parentContactNo: '+91-9999999992',
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@sau.ac.in' },
    update: {},
    create: {
      email: 'student@sau.ac.in',
      name: 'Arjun Mehta',
      password: await hash('student123'),
      role: 'STUDENT',
      phone: '+91-9876543210',
      avatarUrl: 'https://placehold.co/200x200/png',
      enrollmentNo: 'SAU-2026-001',
      course: 'M.Tech Computer Science',
      coursePreference: 'ENGINEERING',
      gender: 'MALE',
      sportsInterests: ['Football', 'Cricket'],
      hobbies: ['Gym', 'Gaming'],
      sleepSchedule: 'NIGHT_OWL',
      noiseTolerance: 'MEDIUM',
      studyHours: 7,
      sleepHours: 6,
      careerGoal: 'Become an AI engineer',
      address: 'New Delhi, India',
      parentContactNo: '+91-9811111111',
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  console.log({ admin, warden, student });

  // Seed leave applications
  await seedLeaveApplications(student.id);

  const blocks = ['A', 'B', 'C'];
  const rooms: Array<{ id: string; number: string }> = [];

  for (const block of blocks) {
    for (let floor = 1; floor <= 4; floor += 1) {
      for (let num = 1; num <= 5; num += 1) {
        const roomNumber = `${block}${floor}0${num}`;
        const room = await prisma.room.upsert({
          where: { number: roomNumber },
          update: {},
          create: {
            number: roomNumber,
            floor,
            block,
            capacity: 2,
            amenities: ['WiFi', 'AC', 'Attached Bathroom'],
            status: 'AVAILABLE',
          },
        });
        rooms.push(room);
      }
    }
  }

  const demoRoom = rooms.find((room) => room.number === 'A101');
  if (demoRoom) {
    await prisma.roomAllocation.upsert({
      where: { userId: student.id },
      update: {},
      create: { userId: student.id, roomId: demoRoom.id, isActive: true },
    });

    await prisma.room.update({
      where: { id: demoRoom.id },
      data: { status: 'OCCUPIED' },
    });
  }

  const demoStudents = [
    {
      name: 'Riya Sen',
      email: 'riya.sen@sau.ac.in',
      phone: '+91-9876500001',
      enrollmentNo: 'SAU-2026-002',
      course: 'BA LLB',
      coursePreference: 'LAW',
      gender: 'FEMALE' as const,
      sportsInterests: ['Chess', 'Cricket'],
      hobbies: ['Singing', 'Writing'],
      sleepSchedule: 'BALANCED',
      noiseTolerance: 'MEDIUM',
      studyHours: 6,
      sleepHours: 7,
      careerGoal: 'Become a constitutional lawyer',
      address: 'Kolkata, India',
      parentContactNo: '+91-9811111112',
      approvalStatus: 'APPROVED' as const,
    },
    {
      name: 'Kabir Nair',
      email: 'kabir.nair@sau.ac.in',
      phone: '+91-9876500002',
      enrollmentNo: 'SAU-2026-003',
      course: 'MA International Relations',
      coursePreference: 'INTERNATIONAL_RELATIONS',
      gender: 'MALE' as const,
      sportsInterests: ['Football', 'Basketball'],
      hobbies: ['Gaming', 'Dancing'],
      sleepSchedule: 'NIGHT_OWL',
      noiseTolerance: 'HIGH',
      studyHours: 5,
      sleepHours: 6,
      careerGoal: 'Work in diplomacy and foreign policy',
      address: 'Kochi, India',
      parentContactNo: '+91-9811111113',
      approvalStatus: 'APPROVED' as const,
    },
    {
      name: 'Meera Iyer',
      email: 'meera.iyer@sau.ac.in',
      phone: '+91-9876500003',
      enrollmentNo: 'SAU-2026-004',
      course: 'MSc Mathematics',
      coursePreference: 'MATHEMATICS',
      gender: 'FEMALE' as const,
      sportsInterests: ['Chess', 'Table Tennis'],
      hobbies: ['Reading', 'Writing'],
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 'LOW',
      studyHours: 8,
      sleepHours: 7,
      careerGoal: 'Pursue mathematical research',
      address: 'Chennai, India',
      parentContactNo: '+91-9811111114',
      approvalStatus: 'APPROVED' as const,
    },
    {
      name: 'Aman Verma',
      email: 'aman.verma@sau.ac.in',
      phone: '+91-9876500004',
      enrollmentNo: 'SAU-2026-005',
      course: 'BA Sociology',
      coursePreference: 'SOCIOLOGY',
      gender: 'MALE' as const,
      sportsInterests: ['Athletics', 'Volleyball'],
      hobbies: ['Painting', 'Reading'],
      sleepSchedule: 'BALANCED',
      noiseTolerance: 'LOW',
      studyHours: 6,
      sleepHours: 8,
      careerGoal: 'Research urban communities and youth policy',
      address: 'Lucknow, India',
      parentContactNo: '+91-9811111115',
      approvalStatus: 'APPROVED' as const,
    },
    {
      name: 'Neha Joshi',
      email: 'neha.joshi@sau.ac.in',
      phone: '+91-9876500005',
      enrollmentNo: 'SAU-2026-006',
      course: 'B.Tech Mechanical Engineering',
      coursePreference: 'ENGINEERING',
      gender: 'FEMALE' as const,
      sportsInterests: ['Badminton', 'Gym'],
      hobbies: ['Gym', 'Reading'],
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 'LOW',
      studyHours: 7,
      sleepHours: 8,
      careerGoal: 'Build sustainable manufacturing systems',
      address: 'Pune, India',
      parentContactNo: '+91-9811111116',
      approvalStatus: 'PENDING' as const,
    },
  ];

  for (const demoStudent of demoStudents) {
    await prisma.user.upsert({
      where: { email: demoStudent.email },
      update: {},
      create: {
        ...demoStudent,
        role: 'STUDENT',
        password: await hash('student123'),
        avatarUrl: 'https://placehold.co/200x200/png',
        approvedAt:
          demoStudent.approvalStatus === 'APPROVED' ? new Date() : null,
      },
    });
  }

  const roommatePairs = [
    { email: 'riya.sen@sau.ac.in', roomNumber: 'A102' },
    { email: 'kabir.nair@sau.ac.in', roomNumber: 'A103' },
    { email: 'meera.iyer@sau.ac.in', roomNumber: 'A104' },
    { email: 'aman.verma@sau.ac.in', roomNumber: 'A105' },
  ];

  for (const pair of roommatePairs) {
    const occupant = await prisma.user.findUnique({
      where: { email: pair.email },
    });
    const room = rooms.find((entry) => entry.number === pair.roomNumber);
    if (!occupant || !room) {
      continue;
    }

    await prisma.roomAllocation.upsert({
      where: { userId: occupant.id },
      update: {},
      create: { userId: occupant.id, roomId: room.id, isActive: true },
    });

    await prisma.room.update({
      where: { id: room.id },
      data: { status: 'OCCUPIED' },
    });
  }

  const complaints = [
    {
      token: 'CPL-DEMO1',
      isAnonymous: true,
      category: 'PLUMBING' as const,
      title: 'Tap leaking in Block B washroom',
      description: 'The tap has been leaking for 2 days, water wastage is significant.',
      status: 'IN_PROGRESS' as const,
      adminNote: 'Plumber scheduled for tomorrow 9 AM.',
    },
    {
      token: 'CPL-DEMO2',
      isAnonymous: false,
      userId: student.id,
      category: 'ELECTRICAL' as const,
      title: 'Corridor light not working',
      description: 'The corridor light on floor 2 Block A has been off for a week.',
      status: 'PENDING' as const,
    },
    {
      token: 'CPL-DEMO3',
      isAnonymous: true,
      category: 'CLEANING' as const,
      title: 'Common area needs cleaning',
      description: 'The common room has not been cleaned in 3 days.',
      status: 'RESOLVED' as const,
      adminNote: 'Cleaned on 24th March. Will schedule daily cleaning.',
    },
  ];

  for (const complaint of complaints) {
    await prisma.complaint.upsert({
      where: { token: complaint.token },
      update: { ...complaint },
      create: { ...complaint },
    });
  }

  const announcements = [
    {
      title: 'Water supply maintenance - Sunday 6 AM to 10 AM',
      content:
        'Water supply will be interrupted on Sunday morning for annual maintenance. Please store water in advance.',
      isUrgent: true,
      createdBy: 'admin@sau.ac.in',
    },
    {
      title: 'Mess menu updated for April',
      content:
        'The monthly mess menu has been updated. New items include regional cuisine on weekends. Check the notice board for details.',
      isUrgent: false,
      createdBy: 'warden@sau.ac.in',
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.create({ data: announcement });
  }

  const knowledgeEntries = [
    {
      content:
        'Mess timings:\n' +
        '- Breakfast: 8:30 AM – 10:30 AM\n' +
        '- Lunch: 12:30 PM – 2:30 PM\n' +
        '- Dinner: 7:30 PM – 9:30 PM\n' +
        'Timings may change on holidays/special days; confirm with the Mess Manager if needed.',
      metadata: { type: 'mess', title: 'Mess timings' },
    },
    {
      content:
        'Weekly mess menu (subject to change):\n\n' +
        'Breakfast (8:30 AM – 10:30 AM)\n' +
        '- Monday: Besan chilla + chutney; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Tuesday: Poha; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Wednesday: Vada sambar / Idli sambar; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Thursday: Poori with aloo dum; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Friday: Upma with chutney; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Saturday: Chhole-bhature; cornflakes; milk; tea; boiled eggs; banana\n' +
        '- Sunday: Aloo paratha; cornflakes; milk; tea; boiled eggs; banana\n\n' +
        'Lunch (12:30 PM – 2:30 PM)\n' +
        '- Monday: Butter paneer masala / Butter chicken + chana dal + rice + roti + raita\n' +
        '- Tuesday: Kadhi pakoda + aloo jeera + rice + roti + raita\n' +
        '- Wednesday: Fish curry / Kadhai paneer + lal masoor dal + rice + roti + raita\n' +
        '- Thursday: Chhole + kewa datshi + rice + roti + raita\n' +
        '- Friday: Sri Lankan chicken curry / Paneer do pyaza + black masoor dal + rice + roti + raita\n' +
        '- Saturday: Khichdi + aloo fry + chutney + mixed raita + papad\n' +
        '- Sunday: Baingan bharta + arhar dal fry + rice + roti + salad\n\n' +
        'Dinner (7:30 PM – 9:30 PM)\n' +
        '- Monday: Gobhi masala + arhar dal + rice + roti + salad\n' +
        '- Tuesday: Mixed vegetables + moong dal + rice + roti + salad\n' +
        '- Wednesday: Aloo shimla + mixed dal + rice + roti + salad\n' +
        '- Thursday: Egg curry / Veg kofta + chana dal + rice + roti + salad\n' +
        '- Friday: Lauki chana + dal makhani + rice + roti + salad\n' +
        '- Saturday: Chicken do pyaza / Kadhai mushroom + chana dal tadka + rice + roti + salad\n' +
        '- Sunday: Veg biryani / Chicken biryani + raita + mirchi ka salan + dessert (kheer / gulab jamun / seviyan)',
      metadata: { type: 'mess', title: 'Weekly mess menu' },
    },
    {
      content:
        'Hostel administrative and support contacts:\n' +
        '- Dr. Bijoy Chand Chatterjee — Warden (Boys Hostel): bijoycc@sau.int, +91 8383888914\n' +
        '- Dr. Rinkoo Devi Gupta — Warden (Girls Hostel): rdgupta@sau.ac.in\n' +
        '- Kajori Bhatnagar — Warden Incharge (Girls Hostel): kajori.bhatnagar@sau.int\n' +
        '- Vineet Ghildyal — Deputy Director (Student Services): vineet@sau.int\n' +
        '- Arvind Singh Negi — Office Assistant (Boys Hostel): +91 9560880253\n' +
        '- Anupma Arora — Office Assistant (Girls Hostel): +91 9971567894\n' +
        '- Sushil Kumar — Mess Manager: +91 7398034344\n' +
        '- Uttam Kumar — Hostel Buildings Caretaker: +91 8130240061\n' +
        '- Bishan Nath — Civil & Electrical Maintenance: +91 9953934396\n' +
        '- Manoj Kumar — Lift Operator: +91 9910263062\n' +
        '- Security Supervisor — Outsourced Security: +91 9599481089\n' +
        '- Mr. CS Chahar — AR (GA) Housekeeping & Security: ar-admin@sau.int\n' +
        '- Prof. Navnit Jha — Dean of Students: navnitjha@sau.ac.in, +91 8800933491',
      metadata: { type: 'contacts', title: 'Hostel contacts (wardens & support)' },
    },
    {
      content:
        'Hostel facilities and general information:\n' +
        '- Total capacity: ~1000 units of shared accommodation\n' +
        '- Structure: 12 different towers\n' +
        '- Room type: large, spacious, partially furnished shared rooms\n' +
        '- Eligibility: on-campus housing for Master’s and Doctoral students\n' +
        '- Max stay (PhD): up to 5 years\n' +
        '- Vacation policy: Master’s students must vacate during summer/winter breaks\n' +
        '- Facilities: mess, lounge, fitness centre, playgrounds, frequent cleaning\n' +
        '- Hostel fee: US $100 per academic semester (SAARC region students)',
      metadata: { type: 'facilities', title: 'Hostel facilities & eligibility' },
    },
    {
      content:
        'Hostel Management Committee (HMC) members:\n' +
        '- Chairperson: Dean of Students\n' +
        '- Member: Registrar (or nominee)\n' +
        '- Member: Warden, Boys’ Hostel\n' +
        '- Member: Warden, Girls’ Hostel\n' +
        '- Member: Dr. Dhananjay Tripathi (Associate Professor, Dept. of IR, FSS)\n' +
        '- Member: Dr. Priti Saxena (Assistant Professor (SG), FLSB)\n' +
        '- Member: President of Hostel Committee (Student Representative)\n' +
        '- Member Secretary: Assistant Director (HSS)',
      metadata: { type: 'committee', title: 'Hostel Management Committee (HMC)' },
    },
    {
      content:
        'Gate closing time is 10:30 PM on weekdays and 11:30 PM on weekends. Late entry must be approved by the warden in advance. Guests are allowed until 8 PM only in common areas.',
      metadata: { type: 'rules', title: 'Gate and guest rules' },
    },
    {
      content:
        'Key hostel rules and regulations:\n' +
        '- Curfew: all residents must report back to SAU campus by 8:00 PM daily\n' +
        '- Attendance: mandatory daily signing in attendance and late-night registers\n' +
        '- Late night / night out: prior written approval by 3:00 PM; late night allowed once a week; night-out limited to 4 non-sequential nights per month\n' +
        '- Visitors: permitted 8:00 AM to 7:00 PM with warden approval and roommate consent\n' +
        '- Prohibited items: cooking in rooms; heaters (>500W); ACs; alcohol; drugs; smoking; pets; roof access\n' +
        '- Fines: INR 10,000 for unauthorized guests; INR 2,000 for lost keys\n' +
        '- Dress code: proper attire required in all common and academic areas\n' +
        '- Inspections: authorities may inspect rooms at any time for safety and security',
      metadata: { type: 'rules', title: 'Rules: curfew, visitors, prohibited items, fines' },
    },
    {
      content:
        'Monthly hostel fee is INR 8,500 including meals. Fees must be paid by the 10th of each month. Late payment incurs a penalty of INR 100 per day. Payment can be made online via the student portal.',
      metadata: { type: 'fees', title: 'Hostel fee structure' },
    },
    {
      content:
        'WiFi is available in all rooms and common areas. Network: SAU-Hostel. Contact IT helpdesk at it@sau.ac.in for issues. Speed: 100 Mbps shared. Downloading torrents or streaming for long periods is discouraged.',
      metadata: { type: 'facilities', title: 'WiFi and internet' },
    },
    {
      content:
        'Laundry room is in Block A basement, open 6 AM to 10 PM daily. Each resident gets 2 free washes per week. Additional washes cost INR 30. Ironing room is adjacent. Report damaged machines to the warden.',
      metadata: { type: 'facilities', title: 'Laundry facilities' },
    },
  ];

  for (const entry of knowledgeEntries) {
    await prisma.knowledgeBase.create({ data: entry });
  }

  // Seed counsellor
  const counsellor = await prisma.user.upsert({
    where: { email: 'counsellor@sau.ac.in' },
    update: {},
    create: {
      name: 'Dr. Priya Sharma',
      email: 'counsellor@sau.ac.in',
      role: 'COUNSELLOR',
      password: await hash('counsellor123'),
      avatarUrl: 'https://placehold.co/200x200/png',
      enrollmentNo: 'COUNSELLOR-001',
      course: 'Student Wellbeing & Counselling',
      coursePreference: 'SOCIOLOGY',
      gender: 'FEMALE',
      sportsInterests: ['Yoga', 'Meditation'],
      hobbies: ['Reading', 'Writing'],
      sleepSchedule: 'BALANCED',
      noiseTolerance: 'LOW',
      studyHours: 5,
      sleepHours: 8,
      careerGoal: 'Support student mental health and wellbeing',
      address: 'Counselling Center, SAU',
      parentContactNo: '+91-9999999990',
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  await prisma.counsellorProfile.upsert({
    where: { userId: counsellor.id },
    update: {},
    create: {
      userId: counsellor.id,
      bio: 'Experienced student wellbeing counsellor with 8 years helping students navigate hostel life, academic pressure, and personal growth.',
      specialties: ['Academic Stress', 'Homesickness', 'Anxiety', 'Conflict Resolution', 'Personal Growth'],
      availability: 'Monday to Friday, 9:00 AM – 5:00 PM',
      isOnline: true,
    },
  });

  console.log(
    'Seed complete. Demo credentials:\n  Admin: admin@sau.ac.in / admin123\n  Warden: warden@sau.ac.in / warden123\n  Student: student@sau.ac.in / student123\n  Counsellor: counsellor@sau.ac.in / counsellor123',
  );
}

async function seedLeaveApplications(studentId: string) {
  console.log('Seeding leave applications...');
  const today = new Date();

  const leaves = [
    // 1. Pending leave
    {
      studentId,
      leaveType: 'HOME',
      reason: 'Going home for a family function.',
      fromDate: new Date(today.setDate(today.getDate() + 2)),
      toDate: new Date(today.setDate(today.getDate() + 5)),
      destination: 'My Hometown',
      contactNumber: '1234567890',
      parentContact: '0987654321',
      status: 'PENDING',
    },
    // 2. Leave approved by warden, pending admin
    {
      studentId,
      leaveType: 'PERSONAL',
      reason: 'Attending a friends wedding.',
      fromDate: new Date(today.setDate(today.getDate() + 10)),
      toDate: new Date(today.setDate(today.getDate() + 12)),
      destination: 'Wedding City',
      contactNumber: '1234567890',
      parentContact: '0987654321',
      status: 'APPROVED_BY_WARDEN',
      wardenRemark: 'Approved. Enjoy the wedding.',
    },
    // 3. Fully approved leave
    {
      studentId,
      leaveType: 'MEDICAL',
      reason: 'Scheduled doctor appointment.',
      fromDate: new Date(new Date().setMonth(today.getMonth() - 1)),
      toDate: new Date(new Date().setMonth(today.getMonth() - 1) + 3),
      destination: 'Local Hospital',
      contactNumber: '1234567890',
      parentContact: '0987654321',
      status: 'APPROVED',
      wardenRemark: 'Approved for medical reasons.',
      adminRemark: 'Final approval granted.',
    },
    // 4. Rejected leave
    {
      studentId,
      leaveType: 'OTHER',
      reason: 'Going on a trip with friends.',
      fromDate: new Date(new Date().setMonth(today.getMonth() - 2)),
      toDate: new Date(new Date().setMonth(today.getMonth() - 2) + 7),
      destination: 'Tourist Place',
      contactNumber: '1234567890',
      parentContact: '0987654321',
      status: 'REJECTED',
      wardenRemark: 'Rejected. Not a valid reason for leave during exams.',
    },
  ];

  for (const leave of leaves) {
    await prisma.leave.create({
      data: leave,
    });
  }

  console.log('Finished seeding leave applications.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
