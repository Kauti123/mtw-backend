import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { MasterDataService } from './masterdata.service';
import { MasterdataRepository } from './masterdata.repository';
import type { CreateCorporateDto } from './dto';

describe('MasterDataService - Corporate Account CRUD', () => {
  let service: MasterDataService;
  let repository: MasterdataRepository;

  beforeEach(() => {
    repository = new MasterdataRepository();
    service = new MasterDataService(repository);
  });

  it('should return health status', () => {
    expect(service.health()).toEqual({
      service: 'masterdata-service',
      status: 'ok',
    });
  });

  it('should create a corporate account with all form fields from UI specification', async () => {
    const input: CreateCorporateDto = {
      companyName: 'Acme Global Technologies',
      corporateCode: 'ACMEGLOBAL',
      industry: 'Technology',
      companyType: 'B2B Corporate',
      status: 'ACTIVE',
      accountConfiguration: {
        accountType: 'B2B Corporate',
        currency: 'INR',
        timezone: 'Asia/Kolkata (GMT +5:30)',
        fiscalYear: 'April - March',
        defaultLanguage: 'English',
      },
      primaryAdmin: {
        firstName: 'John',
        lastName: 'Mathew',
        workEmail: 'john.m@acmeglobal.com',
        phoneCountryCode: '+91',
        phoneNumber: '9876543210',
        employeeId: 'EMP001',
        designation: 'Travel Manager',
        department: 'Travel & Administration',
        sendWelcomeEmail: true,
      },
      adminAccess: {
        role: 'Corporate Admin',
        loginMethod: 'EMAIL_OTP',
        mfaRequired: true,
        accountStatus: 'ACTIVE',
      },
      bookingSettings: {
        flightBooking: true,
        hotelBooking: true,
        groundTransport: true,
        allowSelfBooking: true,
        allowGuestBooking: false,
        cancellationAllowed: true,
      },
      creditAndBilling: {
        billingMode: 'Credit Limit',
        creditLimit: 1000000,
        paymentTerms: 'Net 30',
        gstNumber: '27ABCDE1234F1Z5',
        taxTreatment: 'Exclusive of Tax',
      },
      securitySettings: {
        sessionTimeout: '60 minutes',
        passwordPolicy: 'Standard (Min 8 characters)',
        ipRestriction: false,
        allowedIpAddresses: [],
        enableLogging: true,
      },
      policySettings: {
        defaultPolicy: 'Standard Corporate Policy',
        flightPolicy: 'Standard Flight Policy',
        hotelPolicy: 'Standard Hotel Policy',
        groundTransportPolicy: 'Standard Transport Policy',
        internationalTravelPolicy: 'International Travel Policy',
      },
      approvalWorkflow: {
        levels: {
          employee: true,
          reportingManager: true,
          travelAdmin: true,
          financeTeam: false,
        },
        approvalThreshold: 50000,
        approvalForInternationalTravel: true,
      },
      spendingLimits: {
        flightPerTrip: 50000,
        hotelPerNight: 15000,
        groundTransportDaily: 5000,
      },
      policyExceptions: {
        allowPolicyException: true,
        approvalRequired: true,
        notifyAdmin: true,
      },
    };

    const created = await service.createCorporate(input);

    expect(created.id).toBeDefined();
    expect(created.companyName).toBe('Acme Global Technologies');
    expect(created.corporateCode).toBe('ACMEGLOBAL');
    expect(created.primaryAdmin.firstName).toBe('John');
    expect(created.primaryAdmin.lastName).toBe('Mathew');
    expect(created.adminAccess.loginMethod).toBe('EMAIL_OTP');
    expect(created.bookingSettings.flightBooking).toBe(true);
    expect(created.creditAndBilling.creditLimit).toBe(1000000);
    expect(created.approvalWorkflow.approvalThreshold).toBe(50000);
    expect(created.spendingLimits.flightPerTrip).toBe(50000);
    expect(created.spendingLimits.hotelPerNight).toBe(15000);
    expect(created.spendingLimits.groundTransportDaily).toBe(5000);
    expect(created.policyExceptions.allowPolicyException).toBe(true);
  });

  it('should prevent duplicate corporate codes', async () => {
    await expect(
      service.createCorporate({
        companyName: 'Duplicate Acme',
        corporateCode: 'ACME001', // Pre-seeded code
        industry: 'Tech',
        companyType: 'B2B Corporate',
        status: 'ACTIVE',
        accountConfiguration: {
          accountType: 'B2B',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          fiscalYear: 'April - March',
          defaultLanguage: 'English',
        },
        primaryAdmin: {
          firstName: 'Jane',
          lastName: 'Doe',
          workEmail: 'jane.doe@newacme.com',
          phoneCountryCode: '+91',
          phoneNumber: '9123456789',
          employeeId: 'EMP002',
          designation: 'Admin',
          department: 'HR',
          sendWelcomeEmail: true,
        },
        adminAccess: {
          role: 'Corporate Admin',
          loginMethod: 'EMAIL_OTP',
          mfaRequired: false,
          accountStatus: 'ACTIVE',
        },
        bookingSettings: {
          flightBooking: true,
          hotelBooking: true,
          groundTransport: true,
          allowSelfBooking: true,
          allowGuestBooking: true,
          cancellationAllowed: true,
        },
        creditAndBilling: {
          billingMode: 'Credit Limit',
          creditLimit: 500000,
          paymentTerms: 'Net 30',
          gstNumber: '27ABCDE1234F1Z5',
          taxTreatment: 'Exclusive of Tax',
        },
        securitySettings: {
          sessionTimeout: '30 minutes',
          passwordPolicy: 'Standard',
          ipRestriction: false,
          allowedIpAddresses: [],
          enableLogging: true,
        },
        policySettings: {
          defaultPolicy: 'Standard Policy',
          flightPolicy: 'Standard Flight Policy',
          hotelPolicy: 'Standard Hotel Policy',
          groundTransportPolicy: 'Standard Transport Policy',
          internationalTravelPolicy: 'International Travel Policy',
        },
        approvalWorkflow: {
          levels: {
            employee: true,
            reportingManager: true,
            travelAdmin: false,
            financeTeam: false,
          },
          approvalThreshold: 25000,
          approvalForInternationalTravel: true,
        },
        spendingLimits: {
          flightPerTrip: 25000,
          hotelPerNight: 8000,
          groundTransportDaily: 3000,
        },
        policyExceptions: {
          allowPolicyException: true,
          approvalRequired: true,
          notifyAdmin: false,
        },
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw BadRequestException when companyName or corporateCode is empty', async () => {
    await expect(
      service.createCorporate({
        companyName: '',
        corporateCode: 'TEST',
      } as unknown as CreateCorporateDto),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createCorporate({
        companyName: 'Test Corp',
        corporateCode: '',
      } as unknown as CreateCorporateDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should list corporate accounts and filter by search query', async () => {
    const list = await service.listCorporates({
      page: 1,
      limit: 10,
      search: 'Acme',
    });

    expect(list.items.length).toBeGreaterThan(0);
    expect(list.items[0]?.companyName).toContain('Acme');
    expect(list.total).toBeGreaterThanOrEqual(1);
  });

  it('should get corporate account by ID or code', async () => {
    const byCode = await service.getCorporateById('ACME001');
    expect(byCode.corporateCode).toBe('ACME001');

    const byId = await service.getCorporateById(byCode.id);
    expect(byId.id).toBe(byCode.id);
  });

  it('should throw NotFoundException for non-existent corporate', async () => {
    await expect(service.getCorporateById('NON_EXISTENT')).rejects.toThrow(NotFoundException);
  });

  it('should update corporate account settings', async () => {
    const existing = await service.getCorporateById('ACME001');
    const updated = await service.updateCorporate(existing.id, {
      creditAndBilling: {
        ...existing.creditAndBilling,
        creditLimit: 2500000,
      },
    });

    expect(updated.creditAndBilling.creditLimit).toBe(2500000);
  });

  it('should update corporate status', async () => {
    const existing = await service.getCorporateById('ACME001');
    const updated = await service.updateCorporateStatus(existing.id, {
      status: 'INACTIVE',
      reason: 'Under maintenance',
    });

    expect(updated.status).toBe('INACTIVE');
  });

  it('should check code availability', async () => {
    const taken = await service.checkCodeAvailability('ACME001');
    expect(taken.available).toBe(false);

    const available = await service.checkCodeAvailability('NEWCORP99');
    expect(available.available).toBe(true);
  });

  it('should delete corporate account', async () => {
    const created = await service.createCorporate({
      companyName: 'To Be Deleted Corp',
      corporateCode: 'DEL001',
      industry: 'Logistics',
      companyType: 'B2B Corporate',
      status: 'DRAFT',
      accountConfiguration: {
        accountType: 'B2B',
        currency: 'USD',
        timezone: 'UTC',
        fiscalYear: 'Jan - Dec',
        defaultLanguage: 'English',
      },
      primaryAdmin: {
        firstName: 'Test',
        lastName: 'User',
        workEmail: 'del.user@testcorp.com',
        phoneCountryCode: '+1',
        phoneNumber: '1234567890',
        designation: 'Admin',
      },
      adminAccess: {
        role: 'Admin',
        loginMethod: 'EMAIL_OTP',
        mfaRequired: false,
        accountStatus: 'ACTIVE',
      },
      bookingSettings: {
        flightBooking: true,
        hotelBooking: true,
        groundTransport: false,
        allowSelfBooking: true,
        allowGuestBooking: false,
        cancellationAllowed: true,
      },
      creditAndBilling: {
        billingMode: 'Prepaid',
        creditLimit: 0,
        paymentTerms: 'Immediate',
        taxTreatment: 'Inclusive of Tax',
      },
      securitySettings: {
        gstNumber: '27ABCDE1234F1Z5',
        sessionTimeout: '15 minutes',
        passwordPolicy: 'Standard',
        ipRestriction: false,
        allowedIpAddresses: [],
        enableLogging: true,
      },
      policySettings: {
        defaultPolicy: 'Standard',
      },
      approvalWorkflow: {
        levels: {
          flightPolicy: 'Standard Flight Policy',
          hotelPolicy: 'Standard Hotel Policy',
          groundTransportPolicy: 'Standard Transport Policy',
          internationalTravelPolicy: 'International Travel Policy',
          employee: true,
          reportingManager: false,
          travelAdmin: false,
          financeTeam: false,
        },
        approvalThreshold: 10000,
        approvalForInternationalTravel: false,
      },
      spendingLimits: {
        flightPerTrip: 10000,
        hotelPerNight: 5000,
        groundTransportDaily: 1000,
      },
      policyExceptions: {
        allowPolicyException: false,
        approvalRequired: true,
        notifyAdmin: false,
      },
    });

    const res = await service.deleteCorporate(created.id);
    expect(res.success).toBe(true);

    await expect(service.getCorporateById(created.id)).rejects.toThrow(NotFoundException);
  });
});
