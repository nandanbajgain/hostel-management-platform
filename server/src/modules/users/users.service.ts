import { Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type SortBy = 'course' | 'sports' | 'career' | 'approval';

type StudentWithAllocation = User & {
  allocation: {
    isActive: boolean;
    room: {
      id: string;
      number: string;
      block: string;
      floor: number;
      capacity: number;
    } | null;
  } | null;
};

type DemoProfile = {
  label: string;
  coursePreference: string;
  sportsInterests: string[];
  hobbies: string[];
  sleepSchedule: string;
  noiseTolerance: string;
  studyHours: number;
  sleepHours: number;
};

type ClusterMember = {
  id: string;
  label: string;
  vector: number[];
};

const COURSE_PREFERENCE_OPTIONS = [
  'ENGINEERING',
  'LAW',
  'INTERNATIONAL_RELATIONS',
  'SOCIOLOGY',
  'MATHEMATICS',
] as const;

const SPORT_OPTIONS = [
  'Football',
  'Cricket',
  'Badminton',
  'Basketball',
  'Table Tennis',
  'Volleyball',
  'Athletics',
  'Chess',
  'Tennis',
  'Gym',
] as const;

const HOBBY_OPTIONS = [
  'Painting',
  'Singing',
  'Gym',
  'Reading',
  'Gaming',
  'Dancing',
  'Cooking',
  'Writing',
] as const;

const SLEEP_SCHEDULE_OPTIONS = ['EARLY_BIRD', 'BALANCED', 'NIGHT_OWL'] as const;
const NOISE_TOLERANCE_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'] as const;

const DEMO_PROFILES: DemoProfile[] = [
  {
    label: 'Focused engineering early riser',
    coursePreference: 'ENGINEERING',
    sportsInterests: ['Badminton', 'Gym'],
    hobbies: ['Reading', 'Gym'],
    sleepSchedule: 'EARLY_BIRD',
    noiseTolerance: 'LOW',
    studyHours: 7,
    sleepHours: 8,
  },
  {
    label: 'Social law student with balanced routine',
    coursePreference: 'LAW',
    sportsInterests: ['Cricket', 'Chess'],
    hobbies: ['Singing', 'Writing'],
    sleepSchedule: 'BALANCED',
    noiseTolerance: 'MEDIUM',
    studyHours: 6,
    sleepHours: 7,
  },
  {
    label: 'Late-night IR collaborator',
    coursePreference: 'INTERNATIONAL_RELATIONS',
    sportsInterests: ['Football', 'Basketball'],
    hobbies: ['Gaming', 'Dancing'],
    sleepSchedule: 'NIGHT_OWL',
    noiseTolerance: 'HIGH',
    studyHours: 5,
    sleepHours: 6,
  },
  {
    label: 'Quiet sociology creative',
    coursePreference: 'SOCIOLOGY',
    sportsInterests: ['Athletics', 'Volleyball'],
    hobbies: ['Painting', 'Reading'],
    sleepSchedule: 'BALANCED',
    noiseTolerance: 'LOW',
    studyHours: 6,
    sleepHours: 8,
  },
  {
    label: 'Maths deep-work profile',
    coursePreference: 'MATHEMATICS',
    sportsInterests: ['Chess', 'Table Tennis'],
    hobbies: ['Reading', 'Writing'],
    sleepSchedule: 'EARLY_BIRD',
    noiseTolerance: 'LOW',
    studyHours: 8,
    sleepHours: 7,
  },
];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listStudents(
    sortBy: SortBy = 'course',
    approvalStatus?: ApprovalStatus,
  ) {
    const students = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(approvalStatus ? { approvalStatus } : {}),
      },
      include: {
        allocation: {
          include: {
            room: true,
          },
        },
      },
      orderBy: [{ approvalStatus: 'asc' }, { name: 'asc' }],
    });

    return students.sort((left, right) => {
      if (sortBy === 'sports') {
        return (left.sportsInterests[0] || '').localeCompare(
          right.sportsInterests[0] || '',
        );
      }
      if (sortBy === 'career') {
        return (left.careerGoal || '').localeCompare(right.careerGoal || '');
      }
      if (sortBy === 'approval') {
        return left.approvalStatus.localeCompare(right.approvalStatus);
      }

      return (left.course || '').localeCompare(right.course || '');
    });
  }

  async updateApproval(
    studentId: string,
    status: ApprovalStatus,
    approvedBy?: string,
  ) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.user.update({
      where: { id: studentId },
      data: {
        approvalStatus: status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: approvedBy || null,
      },
    });
  }

  async getRoommateSuggestions(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('Student not found');
    }

    const candidates = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        id: { not: studentId },
        approvalStatus: { not: 'REJECTED' },
      },
      include: {
        allocation: {
          include: { room: true },
        },
      },
    });

    const allProfiles: StudentWithAllocation[] = [
      {
        ...student,
        allocation: null,
      },
      ...candidates,
    ];

    const clustering = this.buildClusters(allProfiles);
    const targetCluster = clustering.membership.get(studentId);
    const targetVector = this.toFeatureVector(student);

    return candidates
      .map((candidate) => {
        const candidateVector = this.toFeatureVector(candidate);
        const distance = this.calculateDistance(targetVector, candidateVector);
        const normalizedDistance = Math.min(distance / 3.5, 1);
        const similarity = 1 - normalizedDistance;
        const sameCluster = clustering.membership.get(candidate.id) === targetCluster;
        const sharedSports = candidate.sportsInterests.filter((sport) =>
          student.sportsInterests.includes(sport),
        );
        const sharedHobbies = candidate.hobbies.filter((hobby) =>
          student.hobbies.includes(hobby),
        );

        let score = Math.round(similarity * 100);
        const reasons: string[] = [];

        if (sameCluster) {
          score += 14;
          reasons.push(
            `same lifestyle cluster: ${clustering.clusterLabels.get(targetCluster || 0) || 'balanced profile'}`,
          );
        }

        if (
          candidate.coursePreference &&
          candidate.coursePreference === student.coursePreference
        ) {
          score += 12;
          reasons.push(
            `same academic preference: ${this.toReadableLabel(candidate.coursePreference)}`,
          );
        }

        if (sharedSports.length > 0) {
          score += Math.min(sharedSports.length * 5, 15);
          reasons.push(`shared sports: ${sharedSports.join(', ')}`);
        }

        if (sharedHobbies.length > 0) {
          score += Math.min(sharedHobbies.length * 5, 15);
          reasons.push(`shared hobbies: ${sharedHobbies.join(', ')}`);
        }

        if (
          candidate.sleepSchedule &&
          candidate.sleepSchedule === student.sleepSchedule
        ) {
          score += 10;
          reasons.push(
            `same sleep schedule: ${this.toReadableLabel(candidate.sleepSchedule)}`,
          );
        }

        if (
          candidate.noiseTolerance &&
          candidate.noiseTolerance === student.noiseTolerance
        ) {
          score += 8;
          reasons.push(
            `similar noise tolerance: ${this.toReadableLabel(candidate.noiseTolerance)}`,
          );
        }

        if (
          typeof candidate.studyHours === 'number' &&
          typeof student.studyHours === 'number' &&
          Math.abs(candidate.studyHours - student.studyHours) <= 2
        ) {
          score += 8;
          reasons.push('study hours are closely aligned');
        }

        if (
          typeof candidate.sleepHours === 'number' &&
          typeof student.sleepHours === 'number' &&
          Math.abs(candidate.sleepHours - student.sleepHours) <= 1
        ) {
          score += 6;
          reasons.push('sleep duration is closely aligned');
        }

        if (
          candidate.gender &&
          student.gender &&
          candidate.gender === student.gender
        ) {
          score += 5;
          reasons.push('same gender');
        }

        const boundedScore = Math.max(0, Math.min(Math.round(score), 99));

        return {
          id: candidate.id,
          name: candidate.name,
          enrollmentNo: candidate.enrollmentNo,
          course: candidate.course,
          coursePreference: candidate.coursePreference,
          gender: candidate.gender,
          sportsInterests: candidate.sportsInterests,
          hobbies: candidate.hobbies,
          sleepSchedule: candidate.sleepSchedule,
          noiseTolerance: candidate.noiseTolerance,
          studyHours: candidate.studyHours,
          sleepHours: candidate.sleepHours,
          careerGoal: candidate.careerGoal,
          phone: candidate.phone,
          avatarUrl: candidate.avatarUrl,
          approvalStatus: candidate.approvalStatus,
          allocation: candidate.allocation,
          score: boundedScore,
          compatibilityBand: this.getCompatibilityBand(boundedScore),
          sameCluster,
          clusterLabel:
            clustering.clusterLabels.get(clustering.membership.get(candidate.id) || 0) ||
            'balanced profile',
          reasons,
        };
      })
      .filter((candidate) => candidate.score >= 45)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);
  }

  private buildClusters(students: StudentWithAllocation[]) {
    const studentMembers: ClusterMember[] = students.map((student) => ({
      id: student.id,
      label: student.name,
      vector: this.toFeatureVector(student),
    }));

    const demoMembers: ClusterMember[] = DEMO_PROFILES.map((profile, index) => ({
      id: `demo-${index}`,
      label: profile.label,
      vector: this.toFeatureVector(profile),
    }));

    const members = [...studentMembers, ...demoMembers];
    const clusterCount = Math.max(
      2,
      Math.min(DEMO_PROFILES.length, Math.ceil(Math.sqrt(members.length / 2))),
    );

    let centroids = demoMembers
      .slice(0, clusterCount)
      .map((member) => [...member.vector]);

    for (let iteration = 0; iteration < 8; iteration += 1) {
      const assignments = members.map((member) =>
        this.findClosestCentroid(member.vector, centroids),
      );

      centroids = centroids.map((centroid, centroidIndex) => {
        const assignedVectors = members
          .filter((_member, index) => assignments[index] === centroidIndex)
          .map((member) => member.vector);

        if (assignedVectors.length === 0) {
          return centroid;
        }

        return centroid.map((_, dimension) => {
          const total = assignedVectors.reduce(
            (sum, vector) => sum + vector[dimension],
            0,
          );
          return total / assignedVectors.length;
        });
      });
    }

    const membership = new Map<string, number>();
    members.forEach((member) => {
      membership.set(member.id, this.findClosestCentroid(member.vector, centroids));
    });

    const clusterLabels = new Map<number, string>();
    for (let clusterIndex = 0; clusterIndex < centroids.length; clusterIndex += 1) {
      const anchor = demoMembers
        .filter((member) => membership.get(member.id) === clusterIndex)
        .sort((left, right) =>
          this.calculateDistance(centroids[clusterIndex], left.vector) -
          this.calculateDistance(centroids[clusterIndex], right.vector),
        )[0];

      clusterLabels.set(clusterIndex, anchor?.label || `Cluster ${clusterIndex + 1}`);
    }

    return { membership, clusterLabels };
  }

  private toFeatureVector(
    profile:
      | Pick<
          User,
          | 'coursePreference'
          | 'sportsInterests'
          | 'hobbies'
          | 'sleepSchedule'
          | 'noiseTolerance'
          | 'studyHours'
          | 'sleepHours'
        >
      | DemoProfile,
  ) {
    const vector: number[] = [];

    COURSE_PREFERENCE_OPTIONS.forEach((option) => {
      vector.push(profile.coursePreference === option ? 1 : 0);
    });

    SPORT_OPTIONS.forEach((sport) => {
      vector.push(profile.sportsInterests.includes(sport) ? 1 : 0);
    });

    HOBBY_OPTIONS.forEach((hobby) => {
      vector.push(profile.hobbies.includes(hobby) ? 1 : 0);
    });

    SLEEP_SCHEDULE_OPTIONS.forEach((option) => {
      vector.push(profile.sleepSchedule === option ? 1 : 0);
    });

    NOISE_TOLERANCE_OPTIONS.forEach((option) => {
      vector.push(profile.noiseTolerance === option ? 1 : 0);
    });

    vector.push((profile.studyHours ?? 6) / 10);
    vector.push((profile.sleepHours ?? 7) / 10);

    return vector;
  }

  private findClosestCentroid(vector: number[], centroids: number[][]) {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    centroids.forEach((centroid, index) => {
      const distance = this.calculateDistance(vector, centroid);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  private calculateDistance(left: number[], right: number[]) {
    return Math.sqrt(
      left.reduce((sum, value, index) => {
        const diff = value - right[index];
        return sum + diff * diff;
      }, 0),
    );
  }

  private getCompatibilityBand(score: number) {
    if (score >= 85) {
      return 'Highly compatible';
    }
    if (score >= 70) {
      return 'Strong match';
    }
    if (score >= 55) {
      return 'Good match';
    }
    return 'Possible match';
  }

  private toReadableLabel(value: string) {
    return value
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }
}
