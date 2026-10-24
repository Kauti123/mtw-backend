import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import type {
  CreateTravelPolicyDto,
  SaveApprovalWorkflowStepDto,
  SaveAssignmentStepDto,
  SaveBasicInfoStepDto,
  SaveSpendingLimitsStepDto,
  SaveTravelRulesStepDto,
  TravelPolicyListResponse,
  TravelPolicyQueryDto,
  TravelPolicyRecord,
  UpdateTravelPolicyDto,
  UpdateTravelPolicyStatusDto,
} from './dto';

@Injectable()
export class PolicyService {
  constructor(private readonly repository: PoliciesRepository) {}

  health() {
    return { service: 'policy-service', status: 'ok' };
  }

  async createPolicy(input: CreateTravelPolicyDto): Promise<TravelPolicyRecord> {
    if (!input.name?.trim()) {
      throw new BadRequestException('Policy name is required');
    }
    if (!input.code?.trim()) {
      throw new BadRequestException('Policy code is required');
    }

    const normalizedCode = input.code.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(`Travel policy with code '${normalizedCode}' already exists.`);
    }

    return this.repository.create({
      ...input,
      code: normalizedCode,
    });
  }

  async listPolicies(query: TravelPolicyQueryDto): Promise<TravelPolicyListResponse> {
    return this.repository.findAll(query);
  }

  async getPolicyById(idOrCode: string): Promise<TravelPolicyRecord> {
    let policy = await this.repository.findById(idOrCode);
    if (!policy) {
      policy = await this.repository.findByCode(idOrCode);
    }
    if (!policy) {
      throw new NotFoundException(`Travel policy '${idOrCode}' was not found.`);
    }
    return policy;
  }

  async updatePolicy(id: string, input: UpdateTravelPolicyDto): Promise<TravelPolicyRecord> {
    const existing = await this.getPolicyById(id);

    if (input.code) {
      const normalizedCode = input.code.trim().toUpperCase();
      if (normalizedCode !== existing.code) {
        const duplicate = await this.repository.findByCode(normalizedCode);
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(`Policy code '${normalizedCode}' is already taken.`);
        }
      }
      input = { ...input, code: normalizedCode };
    }

    const updated = await this.repository.update(existing.id, input);
    if (!updated) {
      throw new NotFoundException(`Failed to update travel policy '${id}'.`);
    }
    return updated;
  }

  /** Step 1 — Basic Information */
  async saveBasicInfoStep(id: string, input: SaveBasicInfoStepDto): Promise<TravelPolicyRecord> {
    return this.updatePolicyStep(id, 1, {
      name: input.name,
      code: input.code,
      policyType: input.policyType,
      description: input.description,
      applicableTo: input.applicableTo,
      status: input.status,
      corporateId: input.corporateId,
      updatedBy: input.updatedBy,
    });
  }

  /** Step 2 — Travel Rules */
  async saveTravelRulesStep(
    id: string,
    input: SaveTravelRulesStepDto,
  ): Promise<TravelPolicyRecord> {
    return this.updatePolicyStep(id, 2, {
      travelRules: input.travelRules,
      updatedBy: input.updatedBy,
    });
  }

  /** Step 3 — Spending Limits */
  async saveSpendingLimitsStep(
    id: string,
    input: SaveSpendingLimitsStepDto,
  ): Promise<TravelPolicyRecord> {
    return this.updatePolicyStep(id, 3, {
      spendingLimits: input.spendingLimits,
      updatedBy: input.updatedBy,
    });
  }

  /** Step 4 — Approval Workflow */
  async saveApprovalWorkflowStep(
    id: string,
    input: SaveApprovalWorkflowStepDto,
  ): Promise<TravelPolicyRecord> {
    return this.updatePolicyStep(id, 4, {
      approvalWorkflow: input.approvalWorkflow,
      updatedBy: input.updatedBy,
    });
  }

  /** Step 5 — Assign & Review */
  async saveAssignmentStep(id: string, input: SaveAssignmentStepDto): Promise<TravelPolicyRecord> {
    const existing = await this.getPolicyById(id);
    const updated = await this.repository.update(
      existing.id,
      {
        assignment: input.assignment,
        updatedBy: input.updatedBy,
        status: input.publish ? 'ACTIVE' : existing.status,
      },
      { step: 5, publish: Boolean(input.publish) },
    );
    if (!updated) {
      throw new NotFoundException(`Failed to save assignment for policy '${id}'.`);
    }
    return updated;
  }

  async updateStatus(id: string, dto: UpdateTravelPolicyStatusDto): Promise<TravelPolicyRecord> {
    return this.updatePolicy(id, {
      status: dto.status,
      updatedBy: dto.updatedBy,
    });
  }

  async deletePolicy(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.getPolicyById(id);
    const deleted = await this.repository.delete(existing.id);
    if (!deleted) {
      throw new NotFoundException(`Failed to delete travel policy '${id}'.`);
    }
    return {
      success: true,
      message: `Travel policy '${existing.name}' (${existing.code}) has been deleted successfully.`,
      id: existing.id,
    };
  }

  async checkCodeAvailability(code: string): Promise<{ code: string; available: boolean }> {
    const normalized = code.trim().toUpperCase();
    const existing = await this.repository.findByCode(normalized);
    return { code: normalized, available: !existing };
  }

  private async updatePolicyStep(
    id: string,
    step: number,
    input: UpdateTravelPolicyDto,
  ): Promise<TravelPolicyRecord> {
    const existing = await this.getPolicyById(id);

    if (input.code) {
      const normalizedCode = input.code.trim().toUpperCase();
      if (normalizedCode !== existing.code) {
        const duplicate = await this.repository.findByCode(normalizedCode);
        if (duplicate && duplicate.id !== existing.id) {
          throw new ConflictException(`Policy code '${normalizedCode}' is already taken.`);
        }
      }
      input = { ...input, code: normalizedCode };
    }

    const updated = await this.repository.update(existing.id, input, { step });
    if (!updated) {
      throw new NotFoundException(`Failed to save step ${step} for travel policy '${id}'.`);
    }
    return updated;
  }
}
