import { MasterDataController } from './masterdata.controller';
import { MasterDataService } from './masterdata.service';
import { MasterdataRepository } from './masterdata.repository';

describe('MasterDataController - Corporate CRUD APIs', () => {
  let controller: MasterDataController;
  let service: MasterDataService;
  let repository: MasterdataRepository;

  beforeEach(() => {
    repository = new MasterdataRepository();
    service = new MasterDataService(repository);
    controller = new MasterDataController(service);
  });

  it('should return health', () => {
    expect(controller.health()).toEqual({
      service: 'masterdata-service',
      status: 'ok',
    });
  });

  it('should create corporate account via controller', async () => {
    const payload = {
      companyName: 'Acme Test Corp',
      corporateCode: 'ACMETEST',
      industry: 'Software',
      primaryAdmin: {
        firstName: 'Alice',
        lastName: 'Smith',
        workEmail: 'alice@acmetest.com',
        phoneNumber: '9876500000',
        designation: 'VP Operations',
      },
      creditAndBilling: {
        billingMode: 'Credit Limit',
        creditLimit: 500000,
        paymentTerms: 'Net 30',
      },
    };

    const res = await controller.createCorporate(payload);
    expect(res.id).toBeDefined();
    expect(res.companyName).toBe('Acme Test Corp');
    expect(res.corporateCode).toBe('ACMETEST');
    expect(res.primaryAdmin.firstName).toBe('Alice');
    expect(res.creditAndBilling.creditLimit).toBe(500000);
  });

  it('should accept flat fields via preprocessing', async () => {
    const flatPayload = {
      companyName: 'Flat Corp',
      corporateCode: 'FLATCORP',
      firstName: 'Bob',
      lastName: 'Marley',
      workEmail: 'bob@flatcorp.com',
      phoneNumber: '9988776655',
      designation: 'Travel Admin',
      creditLimit: 750000,
    };

    const res = await controller.createCorporate(flatPayload);
    expect(res.companyName).toBe('Flat Corp');
    expect(res.primaryAdmin.firstName).toBe('Bob');
    expect(res.creditAndBilling.creditLimit).toBe(750000);
  });

  it('should list corporates', async () => {
    const res = await controller.listCorporates({});
    expect(res.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should get corporate by id', async () => {
    const res = await controller.getCorporateById('ACME001');
    expect(res.code).toBe('ACME001');
  });

  it('should update corporate', async () => {
    const updated = await controller.updateCorporate('ACME001', {
      companyName: 'Acme Updated Corporation',
    });
    expect(updated.companyName).toBe('Acme Updated Corporation');
  });

  it('should update status', async () => {
    const updated = await controller.updateStatus('ACME001', {
      status: 'INACTIVE',
    });
    expect(updated.status).toBe('INACTIVE');
  });

  it('should check code availability', async () => {
    const taken = await controller.checkCodeAvailability('ACME001');
    expect(taken.available).toBe(false);

    const available = await controller.checkCodeAvailability('FREECODE123');
    expect(available.available).toBe(true);
  });

  it('should delete corporate', async () => {
    const created = await controller.createCorporate({
      companyName: 'To Delete',
      corporateCode: 'DEL999',
      firstName: 'Del',
      lastName: 'Admin',
      workEmail: 'del@delcorp.com',
      phoneNumber: '1122334455',
      designation: 'Admin',
    });

    const res = await controller.deleteCorporate(created.id);
    expect(res.success).toBe(true);
  });
});
