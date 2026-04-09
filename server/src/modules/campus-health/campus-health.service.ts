import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HealthAppointmentStatus,
  InsuranceClaimStatus,
  MedicalDocumentStatus,
  PrescriptionStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAvailabilityDto,
  CreateHealthAppointmentDto,
  UpdateHealthAppointmentDto,
  UpsertVisitRecordDto,
  CreateMedicineDto,
  UpdateMedicineDto,
  CreateInsuranceClaimDto,
  UpdateInsuranceClaimDto,
  CreateMedicalLeaveDto,
  UpdateMedicalLeaveDto,
} from './dto';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

@Injectable()
export class CampusHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDoctorProfile(doctorUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: doctorUserId } });
    if (!user || user.role !== Role.DOCTOR) {
      throw new ForbiddenException('Only doctors can access this');
    }

    const existing = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });
    if (existing) return existing;

    return this.prisma.doctorProfile.create({
      data: {
        userId: doctorUserId,
        specialization: 'General Physician',
        clinicLocation: 'Campus Health Center',
        availabilityNote: 'Mon-Fri, 10:00 AM - 4:00 PM',
        isActive: true,
      },
    });
  }

  async listDoctors() {
    return this.prisma.doctorProfile.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getDoctorAvailability(doctorUserId: string) {
    const doctor = await this.ensureDoctorProfile(doctorUserId);
    return this.prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async replaceDoctorAvailability(doctorUserId: string, items: CreateAvailabilityDto[]) {
    const doctor = await this.ensureDoctorProfile(doctorUserId);
    for (const item of items) {
      if (item.endMinute <= item.startMinute) {
        throw new BadRequestException('endMinute must be greater than startMinute');
      }
    }

    await this.prisma.doctorAvailability.deleteMany({ where: { doctorId: doctor.id } });
    if (items.length === 0) return [];

    return this.prisma.doctorAvailability.createMany({
      data: items.map((item) => ({
        doctorId: doctor.id,
        dayOfWeek: item.dayOfWeek,
        startMinute: item.startMinute,
        endMinute: item.endMinute,
        slotDurationMins: item.slotDurationMins ?? 30,
        isActive: item.isActive ?? true,
      })),
    });
  }

  async getAvailableSlots(doctorProfileId: string, fromIso: string, toIso: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      include: { availability: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
      throw new BadRequestException('Invalid from/to');
    }

    const availability = doctor.availability.filter((a) => a.isActive);
    if (availability.length === 0) return [];

    const booked = await this.prisma.healthAppointment.findMany({
      where: {
        doctorId: doctorProfileId,
        status: { in: [HealthAppointmentStatus.REQUESTED, HealthAppointmentStatus.CONFIRMED] },
        scheduledAt: { gte: from, lte: to },
      },
      select: { scheduledAt: true },
    });
    const bookedSet = new Set(booked.map((b) => b.scheduledAt.getTime()));

    const slots: string[] = [];
    const now = Date.now();
    for (let d = startOfDay(from); d <= to; d = addMinutes(d, 24 * 60)) {
      const day = d.getDay();
      const dayBlocks = availability.filter((a) => a.dayOfWeek === day);
      for (const block of dayBlocks) {
        const dur = block.slotDurationMins;
        for (let minute = block.startMinute; minute + dur <= block.endMinute; minute += dur) {
          const slot = addMinutes(d, minute);
          if (slot < from || slot > to) continue;
          if (slot.getTime() < now) continue;
          if (bookedSet.has(slot.getTime())) continue;
          slots.push(slot.toISOString());
        }
      }
    }

    return slots;
  }

  async createAppointment(studentId: string, dto: CreateHealthAppointmentDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { availability: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid scheduledAt');

    const from = addMinutes(scheduledAt, -1);
    const to = addMinutes(scheduledAt, 1);
    const slots = await this.getAvailableSlots(doctor.id, from.toISOString(), to.toISOString());
    if (!slots.some((s) => new Date(s).getTime() === scheduledAt.getTime())) {
      throw new BadRequestException('Selected slot is not available');
    }

    return this.prisma.healthAppointment.create({
      data: {
        studentId,
        doctorId: doctor.id,
        scheduledAt,
        durationMins: 30,
        reason: dto.reason,
        status: HealthAppointmentStatus.REQUESTED,
      },
      include: { doctor: { include: { user: true } } },
    });
  }

  async listMyAppointments(studentId: string) {
    return this.prisma.healthAppointment.findMany({
      where: { studentId },
      orderBy: { scheduledAt: 'desc' },
      include: { doctor: { include: { user: true } }, record: { include: { prescription: { include: { items: true } } } } },
      take: 50,
    });
  }

  async listDoctorAppointments(doctorUserId: string) {
    const doctor = await this.ensureDoctorProfile(doctorUserId);
    return this.prisma.healthAppointment.findMany({
      where: { doctorId: doctor.id },
      orderBy: { scheduledAt: 'asc' },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
        record: { include: { prescription: { include: { items: { include: { medicine: true } } } } } },
      },
      take: 200,
    });
  }

  async updateAppointment(appointmentId: string, userId: string, role: Role, dto: UpdateHealthAppointmentDto) {
    const appt = await this.prisma.healthAppointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: { include: { user: true } } },
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    const isStudent = appt.studentId === userId;
    const isDoctor = appt.doctor.userId === userId;
    const isAdmin = role === Role.ADMIN;

    if (!isStudent && !isDoctor && !isAdmin) throw new ForbiddenException('Not allowed');

    if (dto.scheduledAt) {
      if (!isStudent && !isDoctor && !isAdmin) throw new ForbiddenException('Not allowed');
    }

    if (dto.status) {
      if (!isDoctor && !isAdmin && dto.status !== HealthAppointmentStatus.CANCELLED) {
        throw new ForbiddenException('Only doctor/admin can change this status');
      }
      if (dto.status === HealthAppointmentStatus.CANCELLED && !isStudent && !isDoctor && !isAdmin) {
        throw new ForbiddenException('Not allowed');
      }
    }

    return this.prisma.healthAppointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        adminNote: dto.adminNote,
      },
      include: { doctor: { include: { user: true } }, student: true },
    });
  }

  async upsertVisitRecord(appointmentId: string, doctorUserId: string, dto: UpsertVisitRecordDto) {
    const doctor = await this.ensureDoctorProfile(doctorUserId);
    const appt = await this.prisma.healthAppointment.findUnique({
      where: { id: appointmentId },
      include: { record: { include: { prescription: { include: { items: true } } } } },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.doctorId !== doctor.id) throw new ForbiddenException('Not allowed');

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.healthVisitRecord.upsert({
        where: { appointmentId },
        update: {
          symptoms: dto.symptoms,
          diagnosis: dto.diagnosis,
          treatmentPlan: dto.treatmentPlan,
          doctorNotes: dto.doctorNotes,
          attachments: dto.attachments ?? undefined,
        },
        create: {
          appointmentId,
          symptoms: dto.symptoms,
          diagnosis: dto.diagnosis,
          treatmentPlan: dto.treatmentPlan,
          doctorNotes: dto.doctorNotes,
          attachments: dto.attachments ?? [],
        },
      });

      if (dto.prescriptionItems && dto.prescriptionItems.length > 0) {
        const prescription = await tx.prescription.upsert({
          where: { recordId: record.id },
          update: { notes: dto.prescriptionNotes },
          create: { recordId: record.id, notes: dto.prescriptionNotes, status: PrescriptionStatus.ISSUED },
        });

        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: prescription.id } });
        await tx.prescriptionItem.createMany({
          data: dto.prescriptionItems.map((item) => ({
            prescriptionId: prescription.id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            durationDays: item.durationDays,
            instructions: item.instructions,
            quantity: item.quantity,
          })),
        });
      }

      return tx.healthVisitRecord.findUnique({
        where: { id: record.id },
        include: { prescription: { include: { items: { include: { medicine: true } } } }, appointment: true },
      });
    });
  }

  async listMedicines() {
    return this.prisma.medicine.findMany({ orderBy: { name: 'asc' }, take: 500 });
  }

  async createMedicine(dto: CreateMedicineDto) {
    return this.prisma.medicine.create({
      data: {
        name: dto.name,
        description: dto.description,
        unit: dto.unit,
        stockQty: dto.stockQty ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
      },
    });
  }

  async updateMedicine(medicineId: string, dto: UpdateMedicineDto) {
    return this.prisma.medicine.update({
      where: { id: medicineId },
      data: dto,
    });
  }

  async dispensePrescription(prescriptionId: string, adminUserId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== Role.ADMIN) throw new ForbiddenException('Only admin can dispense');

    return this.prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.findUnique({
        where: { id: prescriptionId },
        include: { items: true },
      });
      if (!prescription) throw new NotFoundException('Prescription not found');
      if (prescription.status === PrescriptionStatus.DISPENSED) return prescription;

      for (const item of prescription.items) {
        if (!item.medicineId || !item.quantity) continue;
        const med = await tx.medicine.findUnique({ where: { id: item.medicineId } });
        if (!med) continue;
        if (med.stockQty < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${med.name}`);
        }
        await tx.medicine.update({
          where: { id: med.id },
          data: { stockQty: med.stockQty - item.quantity },
        });
      }

      return tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: PrescriptionStatus.DISPENSED },
        include: { items: { include: { medicine: true } } },
      });
    });
  }

  async listMyPrescriptions(studentId: string) {
    const records = await this.prisma.healthVisitRecord.findMany({
      where: { appointment: { studentId } },
      include: { prescription: { include: { items: { include: { medicine: true } } } }, appointment: { include: { doctor: { include: { user: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.filter((r) => r.prescription).map((r) => r.prescription);
  }

  async createInsuranceClaim(studentId: string, dto: CreateInsuranceClaimDto) {
    if (dto.appointmentId) {
      const appt = await this.prisma.healthAppointment.findUnique({ where: { id: dto.appointmentId } });
      if (!appt || appt.studentId !== studentId) {
        throw new ForbiddenException('Invalid appointment');
      }
    }

    return this.prisma.insuranceClaim.create({
      data: {
        studentId,
        appointmentId: dto.appointmentId,
        amount: dto.amount,
        description: dto.description,
        billUrl: dto.billUrl,
        status: InsuranceClaimStatus.SUBMITTED,
      },
    });
  }

  async listMyClaims(studentId: string) {
    return this.prisma.insuranceClaim.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listClaims() {
    return this.prisma.insuranceClaim.findMany({
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, name: true, email: true } }, appointment: true, processedBy: { select: { id: true, name: true } } },
      take: 200,
    });
  }

  async updateClaim(claimId: string, adminUserId: string, dto: UpdateInsuranceClaimDto) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== Role.ADMIN) throw new ForbiddenException('Only admin can update claims');

    return this.prisma.insuranceClaim.update({
      where: { id: claimId },
      data: {
        status: dto.status,
        adminNote: dto.adminNote,
        processedById: adminUserId,
      },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  }

  async createMedicalLeave(studentId: string, dto: CreateMedicalLeaveDto) {
    const from = new Date(dto.fromDate);
    const to = new Date(dto.toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
      throw new BadRequestException('Invalid date range');
    }

    return this.prisma.medicalLeaveRequest.create({
      data: {
        studentId,
        fromDate: from,
        toDate: to,
        reason: dto.reason,
        documentUrl: dto.documentUrl,
        status: MedicalDocumentStatus.SUBMITTED,
      },
    });
  }

  async listMyMedicalLeave(studentId: string) {
    return this.prisma.medicalLeaveRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listMedicalLeaveRequests() {
    return this.prisma.medicalLeaveRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, name: true, email: true } }, verifiedBy: { select: { id: true, name: true } } },
      take: 200,
    });
  }

  async updateMedicalLeave(requestId: string, adminUserId: string, dto: UpdateMedicalLeaveDto) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== Role.ADMIN) throw new ForbiddenException('Only admin can update');

    return this.prisma.medicalLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        adminNote: dto.adminNote,
        verifiedById: adminUserId,
      },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  }
}

